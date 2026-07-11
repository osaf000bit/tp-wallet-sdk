/* Decimal Wallet — non-custodial. Connects to an injected wallet (TokenPocket
 * dApp browser, MetaMask, etc.), reads live balances from BSC and lets the user
 * send BNB / tokens. Private keys never leave the user's wallet app. */
(function () {
  'use strict';

  var cfg = window.DECIMAL_WALLET_CONFIG;
  var CHAIN_ID = Number(cfg.chainId);
  var CHAIN_HEX = '0x' + CHAIN_ID.toString(16);

  var ERC20_ABI = [
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
    'function balanceOf(address) view returns (uint256)',
    'function transfer(address to, uint256 value) returns (bool)'
  ];
  var MULTICALL3 = '0xcA11bde05977b3631167028862bE2a173976CA11';
  var MULTICALL3_ABI = [
    'function aggregate3((address target, bool allowFailure, bytes callData)[] calls) view returns ((bool success, bytes returnData)[])',
    'function getEthBalance(address addr) view returns (uint256)'
  ];

  // Read-only provider for balance queries (batching disabled; we use Multicall3).
  var readProvider = new ethers.JsonRpcProvider(cfg.rpcUrl, CHAIN_ID, {
    batchMaxCount: 1
  });
  var erc20Iface = new ethers.Interface(ERC20_ABI);
  var mcIface = new ethers.Interface(MULTICALL3_ABI);
  var multicall = new ethers.Contract(MULTICALL3, MULTICALL3_ABI, readProvider);

  var browserProvider = null;
  var account = null;
  var lastItems = []; // loaded assets (for the Send dropdown)
  var isConnected = false;
  var handlers = null;

  var els = {
    connect: document.getElementById('connect'),
    disconnect: document.getElementById('disconnect'),
    connected: document.getElementById('connected'),
    account: document.getElementById('account'),
    refresh: document.getElementById('refresh'),
    total: document.getElementById('total-balance'),
    note: document.getElementById('balance-note'),
    assets: document.getElementById('assets'),
    sendCard: document.getElementById('send-card'),
    asset: document.getElementById('asset'),
    assetSelect: document.getElementById('asset-select'),
    assetTrigger: document.getElementById('asset-trigger'),
    assetOptions: document.getElementById('asset-options'),
    to: document.getElementById('to'),
    amount: document.getElementById('amount'),
    send: document.getElementById('send'),
    convert: document.getElementById('convert'),
    sendStatus: document.getElementById('send-status'),
    contractLink: document.getElementById('contract-link')
  };

  var shos = cfg.tokens.find(function (t) {
    return (t.symbol || '').toUpperCase() === 'SHOS';
  });
  if (shos) els.contractLink.href = cfg.explorer + '/token/' + shos.address;

  /* ---------- formatting helpers ---------- */
  function fmtUsd(n) {
    return '$' + Number(n).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
  function fmtAmount(amount, decimals) {
    var s = String(amount);
    var neg = s.charAt(0) === '-';
    if (neg) s = s.slice(1);
    var parts = s.split('.');
    var intPart = parts[0] || '0';
    var fracPart = parts[1] || '';
    var target = 21;
    if (typeof decimals === 'number' && decimals > target) target = decimals;
    if (fracPart.length > target) {
      fracPart = fracPart.slice(0, target);
    } else if (fracPart.length < target) {
      var zeros = '';
      var needed = target - fracPart.length;
      while (zeros.length < needed) zeros += '0';
      fracPart += zeros;
    }
    var groups = [];
    var i = intPart.length;
    while (i > 3) {
      groups.unshift(intPart.slice(i - 3, i));
      i -= 3;
    }
    groups.unshift(intPart.slice(0, i));
    return (neg ? '-' : '') + groups.join(',') + '.' + fracPart;
  }
  function shortAddr(a) {
    return a.slice(0, 6) + '…' + a.slice(-4);
  }
  function setStatus(msg, kind) {
    if (!msg) {
      els.sendStatus.hidden = true;
      els.sendStatus.textContent = '';
      els.sendStatus.className = 'status';
      return;
    }
    els.sendStatus.hidden = false;
    els.sendStatus.textContent = msg;
    els.sendStatus.className = 'status' + (kind ? ' ' + kind : '');
  }

  /* ---------- balances (read-only via Multicall3) ---------- */
  function decodeOrNull(fn, data) {
    try {
      return erc20Iface.decodeFunctionResult(fn, data)[0];
    } catch (e) {
      return null;
    }
  }

  async function fetchPrices(ids) {
    var unique = ids.filter(function (v, i) { return v && ids.indexOf(v) === i; });
    if (unique.length === 0) return {};
    try {
      var url =
        'https://api.coingecko.com/api/v3/simple/price?ids=' +
        encodeURIComponent(unique.join(',')) + '&vs_currencies=usd';
      var res = await fetch(url);
      if (!res.ok) return {};
      var data = await res.json();
      var out = {};
      Object.keys(data).forEach(function (k) { out[k] = data[k].usd; });
      return out;
    } catch (e) {
      return {};
    }
  }

  function assetRow(item) {
    var li = document.createElement('li');
    li.className = 'asset';

    var left = document.createElement('div');
    left.className = 'asset-left';
    var badge;
    if ((item.symbol || '').toUpperCase() === 'SHOS') {
      badge = document.createElement('img');
      badge.className = 'badge-img';
      badge.src = 'assets/shos.png';
      badge.alt = 'SHOS';
    } else {
      badge = document.createElement('span');
      badge.className = 'badge';
      badge.textContent = (item.symbol || '?').slice(0, 4);
    }
    var meta = document.createElement('div');
    var sym = document.createElement('div');
    sym.className = 'asset-symbol';
    sym.textContent = item.symbol;
    var name = document.createElement('div');
    name.className = 'asset-name';
    name.textContent = item.name || '';
    meta.appendChild(sym);
    meta.appendChild(name);
    left.appendChild(badge);
    left.appendChild(meta);

    var right = document.createElement('div');
    right.className = 'asset-right';
    var amt = document.createElement('div');
    amt.className = 'asset-amount';
    amt.textContent = fmtAmount(item.amount, item.decimals) + ' ' + item.symbol;
    var usd = document.createElement('div');
    usd.className = 'asset-usd';
    usd.textContent = item.usd === null ? 'price n/a' : fmtUsd(item.usd);
    right.appendChild(amt);
    right.appendChild(usd);

    li.appendChild(left);
    li.appendChild(right);
    return li;
  }

  function renderAssets(items) {
    els.assets.innerHTML = '';
    if (items.length === 0) {
      var li = document.createElement('li');
      li.className = 'empty';
      li.textContent = 'No balances found.';
      els.assets.appendChild(li);
      return;
    }
    items.forEach(function (it) { els.assets.appendChild(assetRow(it)); });
  }

  function formatSelectLabel(it) {
    return it.symbol + ' — ' + fmtAmount(it.amount, it.decimals);
  }

  function populateAssetSelect(items) {
    els.asset.value = '';
    els.assetOptions.innerHTML = '';
    items.forEach(function (it, idx) {
      var div = document.createElement('div');
      div.className = 'select-option';
      div.dataset.value = String(idx);
      div.textContent = formatSelectLabel(it);
      div.addEventListener('click', function () {
        els.asset.value = div.dataset.value;
        els.assetTrigger.textContent = formatSelectLabel(it);
        els.assetOptions.classList.remove('open');
        Array.from(els.assetOptions.children).forEach(function (c) { c.classList.remove('selected'); });
        div.classList.add('selected');
      });
      els.assetOptions.appendChild(div);
    });
    if (items.length) {
      els.asset.value = '0';
      els.assetTrigger.textContent = formatSelectLabel(items[0]);
      els.assetOptions.children[0].classList.add('selected');
    } else {
      els.assetTrigger.textContent = 'Select an asset';
    }
  }

  function toggleAssetSelect() {
    els.assetOptions.classList.toggle('open');
  }

  document.addEventListener('click', function (e) {
    if (!els.assetTrigger || !els.assetOptions) return;
    if (!els.assetSelect.contains(e.target) && !els.assetTrigger.contains(e.target)) {
      els.assetOptions.classList.remove('open');
    }
  });
  els.assetTrigger.addEventListener('click', toggleAssetSelect);

  async function loadBalances() {
    if (!account) return;
    els.note.textContent = 'Loading live balances…';
    els.assets.innerHTML = '<li class="empty">Loading…</li>';

    var priceIds = [];
    if (cfg.native.coingeckoId) priceIds.push(cfg.native.coingeckoId);
    cfg.tokens.forEach(function (t) { if (t.coingeckoId) priceIds.push(t.coingeckoId); });
    var pricesPromise = fetchPrices(priceIds);

    var calls = [];
    calls.push({
      target: MULTICALL3,
      allowFailure: true,
      callData: mcIface.encodeFunctionData('getEthBalance', [account])
    });
    cfg.tokens.forEach(function (t) {
      calls.push({ target: t.address, allowFailure: true, callData: erc20Iface.encodeFunctionData('symbol', []) });
      calls.push({ target: t.address, allowFailure: true, callData: erc20Iface.encodeFunctionData('decimals', []) });
      calls.push({ target: t.address, allowFailure: true, callData: erc20Iface.encodeFunctionData('balanceOf', [account]) });
    });

    var results = await multicall.aggregate3.staticCall(calls);
    var prices = await pricesPromise;

    var items = [];
    if (results[0].success) {
      var nativeWei = mcIface.decodeFunctionResult('getEthBalance', results[0].returnData)[0];
      items.push({
        kind: 'native',
        symbol: cfg.native.symbol,
        name: cfg.native.name,
        decimals: cfg.native.decimals,
        amount: ethers.formatUnits(nativeWei, cfg.native.decimals),
        raw: nativeWei,
        coingeckoId: cfg.native.coingeckoId || null,
        staticUsdPrice: null,
        usd: null
      });
    }
    cfg.tokens.forEach(function (t, i) {
      var base = 1 + i * 3;
      if (!results[base].success || !results[base + 1].success || !results[base + 2].success) return;
      var symbol = decodeOrNull('symbol', results[base].returnData);
      var decimals = decodeOrNull('decimals', results[base + 1].returnData);
      var raw = decodeOrNull('balanceOf', results[base + 2].returnData);
      if (symbol === null || decimals === null || raw === null) return;
      var dec = Number(decimals);
      items.push({
        kind: 'token',
        address: t.address,
        symbol: t.symbol || symbol,
        name: t.name || symbol,
        decimals: dec,
        amount: ethers.formatUnits(raw, dec),
        raw: raw,
        coingeckoId: t.coingeckoId || null,
        staticUsdPrice: typeof t.staticUsdPrice === 'number' ? t.staticUsdPrice : null,
        usd: null
      });
    });

    var total = 0;
    items.forEach(function (it) {
      var price = null;
      if (it.staticUsdPrice !== null) price = it.staticUsdPrice;
      else if (it.coingeckoId && prices[it.coingeckoId] !== undefined) price = prices[it.coingeckoId];
      if (price !== null) { it.usd = it.amount * price; total += it.usd; }
    });
    items.sort(function (a, b) {
      var av = a.usd === null ? -1 : a.usd;
      var bv = b.usd === null ? -1 : b.usd;
      if (bv !== av) return bv - av;
      return Number(b.amount) - Number(a.amount);
    });

    lastItems = items;
    renderAssets(items);
    populateAssetSelect(items);
    els.total.textContent = fmtUsd(total);
    var priced = items.filter(function (i) { return i.usd !== null; }).length;
    els.note.textContent = items.length + ' assets · ' + priced + ' with live USD price';
  }

  /* ---------- wallet connection ---------- */
  function getInjected() {
    return window.ethereum || null;
  }

  async function ensureChain(eth) {
    try {
      var current = await eth.request({ method: 'eth_chainId' });
      if (current && current.toLowerCase() === CHAIN_HEX) return;
      await eth.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: CHAIN_HEX }]
      });
    } catch (e) {
      // 4902 = chain not added; try to add BSC.
      if (e && e.code === 4902) {
        await eth.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: CHAIN_HEX,
            chainName: 'BNB Smart Chain',
            nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
            rpcUrls: [cfg.rpcUrl],
            blockExplorerUrls: [cfg.explorer]
          }]
        });
      }
      // Non-fatal: reads still use our own RPC. Sends will prompt anyway.
    }
  }

  function onConnected(addr) {
    var newAddr = ethers.getAddress(addr);
    if (isConnected && account === newAddr) return;
    isConnected = true;
    account = newAddr;
    els.account.textContent = account;
    els.connected.hidden = false;
    els.sendCard.hidden = false;
    els.connect.textContent = shortAddr(account);
    els.refresh.disabled = false;
    loadBalances().catch(function (e) {
      els.note.textContent = 'Failed to load balances: ' + e.message;
    });
  }

  function onDisconnected() {
    if (!isConnected) return;
    isConnected = false;
    account = null;
    lastItems = [];
    els.connected.hidden = true;
    els.sendCard.hidden = true;
    els.connect.textContent = 'Connect Wallet';
    els.refresh.disabled = true;
    els.total.textContent = '$0.00';
    els.note.textContent = 'Connect your wallet to begin.';
    els.assets.innerHTML = '<li class="empty">Not connected.</li>';
    setStatus('');
    unregisterListeners(getInjected());
    browserProvider = null;
  }

  function handleAccountsChanged(accs) {
    if (!isConnected) return;
    if (accs && accs.length) onConnected(accs[0]);
    else onDisconnected();
  }

  function handleChainChanged() {
    if (isConnected && account) loadBalances().catch(function () {});
  }

  function registerListeners(eth) {
    unregisterListeners(eth);
    if (eth && eth.on) {
      handlers = {
        accounts: handleAccountsChanged,
        chain: handleChainChanged
      };
      eth.on('accountsChanged', handlers.accounts);
      eth.on('chainChanged', handlers.chain);
    }
  }

  function unregisterListeners(eth) {
    if (eth && handlers && eth.removeListener) {
      try {
        eth.removeListener('accountsChanged', handlers.accounts);
        eth.removeListener('chainChanged', handlers.chain);
      } catch (e) { /* ignore */ }
    }
    handlers = null;
  }

  async function connect() {
    var eth = getInjected();
    if (!eth) {
      alert(
        'No wallet detected. Open this page inside the TokenPocket dApp browser ' +
        '(or a browser with MetaMask) and try again.'
      );
      return;
    }
    els.connect.disabled = true;
    try {
      registerListeners(eth);
      var accounts = await eth.request({ method: 'eth_requestAccounts' });
      await ensureChain(eth);
      browserProvider = new ethers.BrowserProvider(eth, 'any');
      if (accounts && accounts.length) onConnected(accounts[0]);
    } catch (e) {
      setStatus('Connection failed: ' + (e.message || e), 'err');
    } finally {
      els.connect.disabled = false;
    }
  }

  /* ---------- send ---------- */
  async function send() {
    if (!account || !browserProvider) return;
    setStatus('');
    var item = lastItems[Number(els.asset.value || '0')];
    if (!item) { setStatus('Select an asset.', 'err'); return; }

    var to = els.to.value.trim();
    if (!ethers.isAddress(to)) { setStatus('Enter a valid recipient address.', 'err'); return; }
    to = ethers.getAddress(to);

    var amountStr = els.amount.value.trim();
    var value;
    try {
      value = ethers.parseUnits(amountStr, item.decimals);
    } catch (e) {
      setStatus('Enter a valid amount.', 'err');
      return;
    }
    if (value <= 0n) { setStatus('Amount must be greater than 0.', 'err'); return; }
    if (item.raw !== undefined && value > item.raw) {
      setStatus('Amount exceeds your ' + item.symbol + ' balance.', 'err');
      return;
    }

    els.send.disabled = true;
    setStatus('Confirm the transaction in your wallet…', 'muted');
    try {
      var signer = await browserProvider.getSigner();
      var tx;
      if (item.kind === 'native') {
        tx = await signer.sendTransaction({ to: to, value: value });
      } else {
        var c = new ethers.Contract(item.address, ERC20_ABI, signer);
        tx = await c.transfer(to, value);
      }
      setStatus('Submitted: ' + tx.hash + ' — waiting for confirmation…', 'muted');
      await tx.wait();
      var link = cfg.explorer + '/tx/' + tx.hash;
      els.sendStatus.hidden = false;
      els.sendStatus.className = 'status ok';
      els.sendStatus.textContent = 'Sent ' + amountStr + ' ' + item.symbol + '. ';
      var a = document.createElement('a');
      a.href = link;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = 'View on BscScan →';
      els.sendStatus.appendChild(a);
      els.amount.value = '';
      loadBalances().catch(function () {});
    } catch (e) {
      var reason = e && (e.shortMessage || e.message) ? (e.shortMessage || e.message) : 'failed';
      setStatus('Transaction failed: ' + reason, 'err');
    } finally {
      els.send.disabled = false;
    }
  }

  function convert() {
    if (!lastItems.length) { setStatus('Select an asset.', 'err'); return; }
    var item = lastItems[Number(els.asset.value || '0')];
    if (!item) { setStatus('Select an asset.', 'err'); return; }
    var shosToken = cfg.tokens.find(function (t) { return (t.symbol || '').toUpperCase() === 'SHOS'; });
    var shosAddr = shosToken ? shosToken.address : '';
    var input = item.kind === 'native' ? 'BNB' : (item.address || '');
    var output = shosAddr;
    if (item.symbol && item.symbol.toUpperCase() === 'SHOS') {
      input = shosAddr;
      output = 'BNB';
    }
    if (!input || !output) { setStatus('Cannot build swap link for this asset.', 'err'); return; }
    var url = 'https://pancakeswap.finance/swap?chain=bsc&inputCurrency=' + encodeURIComponent(input) + '&outputCurrency=' + encodeURIComponent(output);
    window.open(url, '_blank');
  }

  /* ---------- wire up ---------- */
  els.connect.addEventListener('click', connect);
  els.disconnect.addEventListener('click', onDisconnected);
  els.refresh.addEventListener('click', function () {
    loadBalances().catch(function () {});
  });
  els.send.addEventListener('click', send);
  els.convert.addEventListener('click', convert);

  // Auto-reconnect if the wallet already authorized this site.
  (async function () {
    var eth = getInjected();
    if (!eth || !eth.request) return;
    try {
      registerListeners(eth);
      var accounts = await eth.request({ method: 'eth_accounts' });
      if (accounts && accounts.length) {
        await ensureChain(eth);
        browserProvider = new ethers.BrowserProvider(eth, 'any');
        onConnected(accounts[0]);
      }
    } catch (e) { /* ignore */ }
  })();
})();
