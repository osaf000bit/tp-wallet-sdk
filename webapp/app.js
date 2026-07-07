(function () {
  'use strict';

  var cfg = window.DECIMAL_WALLET_CONFIG;
  var tp = window.TpWalletBrowser;

  var ERC20_ABI = [
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
    'function totalSupply() view returns (uint256)',
    'function cap() view returns (uint256)',
    'function balanceOf(address) view returns (uint256)'
  ];

  var provider = new ethers.JsonRpcProvider(cfg.rpcUrl);
  var token = new ethers.Contract(cfg.token.address, ERC20_ABI, provider);

  function $(id) {
    return document.getElementById(id);
  }

  function setStatus(el, msg, kind) {
    el.textContent = msg || '';
    el.className = 'status' + (kind ? ' ' + kind : '');
  }

  function fmt(n) {
    // Trim trailing zeros for display.
    var s = ethers.formatUnits(n, 18);
    return s.replace(/\.0$/, '');
  }

  // ---- Token metadata ----
  async function loadToken() {
    var link = $('tk-contract-link');
    link.href = cfg.explorer + '/address/' + cfg.token.address;
    $('tk-contract').textContent = cfg.token.address;
    try {
      var results = await Promise.all([
        token.name(),
        token.symbol(),
        token.decimals(),
        token.totalSupply(),
        token.cap()
      ]);
      $('tk-name').textContent = results[0];
      $('tk-symbol').textContent = results[1];
      $('tk-decimals').textContent = results[2].toString();
      $('tk-supply').textContent = fmt(results[3]);
      $('tk-cap').textContent = fmt(results[4]);
      setStatus($('token-status'), '');
    } catch (err) {
      setStatus($('token-status'), 'Failed to load token: ' + err.message, 'error');
    }
  }

  // ---- Balances ----
  async function checkBalances() {
    var addr = $('addr').value.trim();
    if (!ethers.isAddress(addr)) {
      setStatus($('bal-status'), 'Enter a valid BSC address.', 'error');
      return;
    }
    setStatus($('bal-status'), 'Loading…');
    try {
      var res = await Promise.all([
        provider.getBalance(addr),
        token.balanceOf(addr)
      ]);
      $('bal-bnb').textContent = Number(ethers.formatEther(res[0])).toFixed(6);
      $('bal-shos').textContent = fmt(res[1]);
      setStatus($('bal-status'), '');
    } catch (err) {
      setStatus($('bal-status'), 'Failed: ' + err.message, 'error');
    }
  }

  // ---- Deeplink + QR ----
  var qr = null;
  function showResult(deeplink) {
    var wrap = $('result');
    wrap.classList.remove('hidden');
    $('deeplink').value = deeplink;
    $('open-btn').href = deeplink;
    var box = $('qrcode');
    box.innerHTML = '';
    qr = new QRCode(box, {
      text: deeplink,
      width: 240,
      height: 240,
      correctLevel: QRCode.CorrectLevel.M
    });
  }

  function commonOpts() {
    return {
      actionId: 'dw-' + Date.now(),
      dappName: cfg.dappName,
      blockchains: [{ chainId: cfg.chainId, network: cfg.network }]
    };
  }

  function buildAuthorize() {
    var req = tp.buildAuthorizeRequest(commonOpts());
    showResult(tp.encodeDeeplink(req));
  }

  function buildTransfer() {
    var to = $('to').value.trim();
    var amount = parseFloat($('amount').value);
    if (!ethers.isAddress(to)) {
      alert('Enter a valid recipient address.');
      return;
    }
    if (!(amount > 0)) {
      alert('Enter a positive amount.');
      return;
    }
    var opts = commonOpts();
    opts.to = to;
    opts.amount = amount;
    opts.contract = cfg.token.address;
    opts.symbol = cfg.token.symbol;
    opts.decimal = 18;
    var req = tp.buildTransferRequest(opts);
    showResult(tp.encodeDeeplink(req));
  }

  // ---- Tabs ----
  function initTabs() {
    var tabs = document.querySelectorAll('.tab');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) {
          t.classList.remove('active');
        });
        tab.classList.add('active');
        var name = tab.getAttribute('data-tab');
        document.querySelectorAll('.tab-panel').forEach(function (p) {
          p.classList.toggle('hidden', p.getAttribute('data-panel') !== name);
        });
        $('result').classList.add('hidden');
      });
    });
  }

  function initCopy() {
    $('copy-btn').addEventListener('click', function () {
      var ta = $('deeplink');
      ta.select();
      navigator.clipboard
        .writeText(ta.value)
        .then(function () {
          $('copy-btn').textContent = 'Copied!';
          setTimeout(function () {
            $('copy-btn').textContent = 'Copy deeplink';
          }, 1500);
        })
        .catch(function () {
          document.execCommand('copy');
        });
    });
  }

  // ---- Wire up ----
  document.addEventListener('DOMContentLoaded', function () {
    initTabs();
    initCopy();
    $('check-btn').addEventListener('click', checkBalances);
    $('addr').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') checkBalances();
    });
    $('authorize-btn').addEventListener('click', buildAuthorize);
    $('transfer-btn').addEventListener('click', buildTransfer);
    loadToken();
  });
})();
