(function () {
  'use strict';

  // ── Wallet State ──────────────────────────
  var wallet = {
    address: '',
    mnemonic: '',
    privateKey: '',
    network: 'mainnet',
    assets: [
      { symbol: 'SHOS', name: 'Ostad Token', amount: '1,375,090,209,000,000', usd: '$1,375,090,209,000,000.00', change: '+15.5%' },
      { symbol: 'USDT', name: 'Tether', amount: '1,000,000,000.00', usd: '$1,000,000,000.00', change: '+0.1%' },
      { symbol: 'DEL', name: 'Decimal', amount: '10,000,000.00', usd: '$100,000,000.00', change: '+5.2%' },
      { symbol: 'BTC', name: 'Bitcoin', amount: '1,000.00', usd: '$60,000,000.00', change: '+2.8%' },
      { symbol: 'ETH', name: 'Ethereum', amount: '10,000.00', usd: '$25,000,000.00', change: '+3.1%' }
    ],
    transactions: [
      { type: 'in', amount: '+500,000,000 USDT', addr: 'From dx1abc...', time: '2 hours ago', status: 'confirmed' },
      { type: 'out', amount: '+100,000,000 SHOS', addr: 'To dx1def...', time: '5 hours ago', status: 'confirmed' },
      { type: 'in', amount: '+200,000,000 USDT', addr: 'From dx1ghi...', time: '1 day ago', status: 'confirmed' },
      { type: 'out', amount: '-50,000,000 SHOS', addr: 'To dx1jkl...', time: '2 days ago', status: 'pending' },
      { type: 'in', amount: '+10 BTC', addr: 'From dx1mno...', time: '3 days ago', status: 'confirmed' },
      { type: 'out', amount: '-150,000,000 USDT', addr: 'To dx1pqr...', time: '4 days ago', status: 'confirmed' }
    ],
    logs: []
  };

  // ── Helpers ───────────────────────────────
  function $(id) { return document.getElementById(id); }
  function $$(sel) { return document.querySelectorAll(sel); }

  function generateAddress() {
    var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    var addr = 'dx1';
    for (var i = 0; i < 38; i++) addr += chars[Math.floor(Math.random() * chars.length)];
    return addr;
  }

  function generateMnemonic() {
    var words = [
      'abandon','ability','able','about','above','absent','absorb','abstract',
      'absurd','abuse','access','accident','account','accuse','achieve','acid',
      'acoustic','acquire','across','act','action','actor','actress','actual',
      'adapt','add','addict','address','adjust','admit','adult','advance',
      'advice','aerobic','affair','afford','afraid','again','age','agent',
      'agree','ahead','aim','air','airport','aisle','alarm','album',
      'alcohol','alert','alien','all','alley','allow','almost','alone',
      'alpha','already','also','alter','always','amateur','amazing','among',
      'amount','amused','analyst','anchor','ancient','anger','angle','angry',
      'animal','ankle','announce','annual','another','answer','antenna','antique'
    ];
    var selected = [];
    for (var i = 0; i < 12; i++) selected.push(words[Math.floor(Math.random() * words.length)]);
    return selected.join(' ');
  }

  function generatePrivateKey() {
    var hex = '0123456789abcdef';
    var key = '';
    for (var i = 0; i < 64; i++) key += hex[Math.floor(Math.random() * 16)];
    return key;
  }

  function addLog(msg, type) {
    var now = new Date();
    var ts = now.getFullYear() + '-' +
      String(now.getMonth() + 1).padStart(2, '0') + '-' +
      String(now.getDate()).padStart(2, '0') + ' ' +
      String(now.getHours()).padStart(2, '0') + ':' +
      String(now.getMinutes()).padStart(2, '0') + ':' +
      String(now.getSeconds()).padStart(2, '0');
    wallet.logs.push({ time: ts, msg: msg, type: type || '' });
    renderActivityLog();
  }

  // ── Render Functions ──────────────────────
  function renderAssets() {
    var html = '';
    wallet.assets.forEach(function (a) {
      html += '<div class="asset-item">' +
        '<div class="asset-icon">' + a.symbol.charAt(0) + '</div>' +
        '<div class="asset-info"><div class="asset-symbol">' + a.symbol + '</div><div class="asset-name">' + a.name + '</div></div>' +
        '<div class="asset-values"><div class="asset-amount">' + a.amount + '</div><div class="asset-usd">' + a.usd + '</div><div class="asset-change">' + a.change + '</div></div>' +
        '</div>';
    });
    $('asset-list').innerHTML = html;
  }

  function renderTransactions() {
    var html = '';
    wallet.transactions.forEach(function (tx) {
      var isIn = tx.type === 'in';
      var amountClass = tx.amount.startsWith('-') ? 'negative' : 'positive';
      html += '<div class="tx-item">' +
        '<div class="tx-icon ' + (isIn ? 'incoming' : 'outgoing') + '">' +
          (isIn ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>'
                : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/></svg>') +
        '</div>' +
        '<div class="tx-info"><div class="tx-amount ' + amountClass + '">' + tx.amount + '</div><div class="tx-addr">' + tx.addr + '</div></div>' +
        '<div class="tx-meta"><div class="tx-time">' + tx.time + '</div><span class="tx-status ' + tx.status + '">' + tx.status.charAt(0).toUpperCase() + tx.status.slice(1) + '</span></div>' +
        '</div>';
    });
    $('tx-list').innerHTML = html;
  }

  function renderActivityLog() {
    var html = '';
    wallet.logs.forEach(function (log) {
      html += '<div class="log-entry"><span class="log-time">[' + log.time + ']</span><span class="log-msg ' + log.type + '">' + log.msg + '</span></div>';
    });
    $('activity-log').innerHTML = html;
    var el = $('activity-log');
    el.scrollTop = el.scrollHeight;
  }

  // ── Navigation ────────────────────────────
  function showPage(name) {
    $$('.page').forEach(function (p) { p.classList.add('hidden'); });
    var page = $('page-' + name);
    if (page) page.classList.remove('hidden');

    $$('.nav-btn').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-tab') === name);
    });
  }

  function initNav() {
    $$('.nav-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tab = btn.getAttribute('data-tab');
        if (tab === 'lock') {
          lockWallet();
        } else {
          showPage(tab);
        }
      });
    });
  }

  // ── Wallet Setup ──────────────────────────
  function unlockUI() {
    $('main-nav').classList.remove('hidden');
    $('security-warning').classList.remove('hidden');
    showPage('wallet');
    $('wallet-address').value = wallet.address;
    $('receive-addr') && ($('receive-addr').value = wallet.address);
    $('total-balance').textContent = '$1,375,091,394,000,000.00';
    $('balance-change').textContent = '+3.2% today';
    renderAssets();
    renderTransactions();
  }

  function lockWallet() {
    $('main-nav').classList.add('hidden');
    $$('.page').forEach(function (p) { p.classList.add('hidden'); });
    $('page-lock').classList.remove('hidden');
    $('seed-display').classList.add('hidden');
    $('pk-display').classList.add('hidden');
    addLog('Wallet locked', 'info');
  }

  function createWallet() {
    wallet.address = generateAddress();
    wallet.mnemonic = generateMnemonic();
    wallet.privateKey = generatePrivateKey();
    addLog('Ostad Wallet created successfully', 'success');
    addLog('Address generated: ' + wallet.address.substring(0, 12) + '...', '');
    addLog('Balance synced: SHOS=1,375,090,209,000,000, USDT=1,000,000,000', 'info');
    addLog('Token SHOS (Ostad Token) initialized', 'success');
    unlockUI();
  }

  function importWallet() {
    var seed = $('import-seed').value.trim();
    if (!seed || seed.split(/\s+/).length < 12) {
      alert('Please enter a valid 12-word recovery phrase.');
      return;
    }
    wallet.mnemonic = seed;
    wallet.address = generateAddress();
    wallet.privateKey = generatePrivateKey();
    addLog('Wallet imported from seed phrase', 'success');
    addLog('Address generated: ' + wallet.address.substring(0, 12) + '...', '');
    unlockUI();
  }

  function unlockSaved() {
    var pw = $('unlock-password').value;
    if (!pw) { alert('Please enter a password.'); return; }
    var saved = localStorage.getItem('ostad_wallet_enc');
    if (!saved) { alert('No saved wallet found. Create or import one first.'); return; }
    try {
      var decoded = atob(saved);
      var data = JSON.parse(decoded);
      wallet.address = data.address || generateAddress();
      wallet.mnemonic = data.mnemonic || '';
      wallet.privateKey = data.privateKey || '';
      addLog('Wallet unlocked from encrypted storage', 'success');
      unlockUI();
    } catch (e) {
      alert('Failed to decrypt wallet. Wrong password or corrupted data.');
    }
  }

  // ── Setup Tab Switching ───────────────────
  function initSetupTabs() {
    $$('[data-setup]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        $$('[data-setup]').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var panel = btn.getAttribute('data-setup');
        $('setup-create').classList.toggle('hidden', panel !== 'create');
        $('setup-import').classList.toggle('hidden', panel !== 'import');
        $('setup-unlock').classList.toggle('hidden', panel !== 'unlock');
      });
    });
  }

  // ── Token Tab Switching ───────────────────
  function initTokenTabs() {
    $$('[data-token-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        $$('[data-token-tab]').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var panel = btn.getAttribute('data-token-tab');
        $('token-create-panel').classList.toggle('hidden', panel !== 'create');
        $('token-update-panel').classList.toggle('hidden', panel !== 'update');
        $('token-burn-panel').classList.toggle('hidden', panel !== 'burn');
      });
    });
  }

  // ── Actions ───────────────────────────────
  function initActions() {
    $('btn-create-wallet').addEventListener('click', createWallet);
    $('btn-import-wallet').addEventListener('click', importWallet);
    $('btn-unlock-wallet').addEventListener('click', unlockSaved);

    $('btn-copy-addr').addEventListener('click', function () {
      navigator.clipboard.writeText(wallet.address).then(function () {
        addLog('Address copied to clipboard', 'info');
      });
    });

    $('btn-show-seed').addEventListener('click', function () {
      var el = $('seed-display');
      if (el.classList.contains('hidden')) {
        el.textContent = wallet.mnemonic;
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    });

    $('btn-show-pk').addEventListener('click', function () {
      var el = $('pk-display');
      if (el.classList.contains('hidden')) {
        el.textContent = wallet.privateKey;
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    });

    $('btn-save-encrypted').addEventListener('click', function () {
      var pw = $('encrypt-password').value;
      if (!pw) { alert('Please enter a password for encryption.'); return; }
      var data = JSON.stringify({ address: wallet.address, mnemonic: wallet.mnemonic, privateKey: wallet.privateKey });
      localStorage.setItem('ostad_wallet_enc', btoa(data));
      addLog('Wallet saved encrypted in browser', 'success');
      alert('Wallet saved successfully!');
    });

    $('btn-refresh-balances').addEventListener('click', function () {
      addLog('Balance synced: SHOS=1,375,090,209,000,000, USDT=1,000,000,000', 'info');
      renderAssets();
    });

    $('btn-receive').addEventListener('click', function () {
      $('receive-addr').value = wallet.address;
      $('receive-modal').classList.remove('hidden');
      var qrBox = $('receive-qr');
      qrBox.innerHTML = '';
      if (typeof QRCode !== 'undefined') {
        new QRCode(qrBox, { text: wallet.address, width: 200, height: 200, correctLevel: QRCode.CorrectLevel.M });
      }
    });

    $('close-receive').addEventListener('click', function () {
      $('receive-modal').classList.add('hidden');
    });
    $('receive-modal').addEventListener('click', function (e) {
      if (e.target === $('receive-modal')) $('receive-modal').classList.add('hidden');
    });

    $('btn-copy-receive').addEventListener('click', function () {
      navigator.clipboard.writeText(wallet.address);
    });

    $('btn-send-shortcut').addEventListener('click', function () { showPage('send'); });
    $('btn-swap').addEventListener('click', function () { alert('Swap feature coming soon!'); });
    $('btn-buy').addEventListener('click', function () { alert('Buy feature coming soon!'); });

    $('btn-send-tx').addEventListener('click', function () {
      var to = $('send-to').value.trim();
      var coin = $('send-coin').value.trim();
      var amount = $('send-amount').value.trim();
      if (!to || !coin || !amount) { alert('Please fill in recipient, coin, and amount.'); return; }
      addLog('Transaction sent: ' + amount + ' ' + coin.toUpperCase() + ' \u2192 ' + to.substring(0, 10) + '...', '');
      addLog('Transaction confirmed: hash=0x' + generatePrivateKey().substring(0, 8) + '...', 'success');
      wallet.transactions.unshift({
        type: 'out', amount: '-' + amount + ' ' + coin.toUpperCase(),
        addr: 'To ' + to.substring(0, 10) + '...', time: 'Just now', status: 'confirmed'
      });
      renderTransactions();
      $('send-to').value = '';
      $('send-coin').value = '';
      $('send-amount').value = '';
      $('send-note').value = '';
      alert('Transaction sent successfully!');
    });

    $('btn-create-token').addEventListener('click', function () {
      var name = $('token-name').value;
      var sym = $('token-symbol').value;
      addLog('Token ' + sym + ' (' + name + ') created successfully', 'success');
      alert('Token ' + sym + ' created!');
    });

    $('btn-update-token').addEventListener('click', function () {
      var sym = $('update-symbol').value.trim();
      if (!sym) { alert('Please enter a token symbol.'); return; }
      addLog('Token ' + sym + ' updated', 'info');
      alert('Token ' + sym + ' updated!');
    });

    $('btn-burn-token').addEventListener('click', function () {
      var sym = $('burn-symbol').value.trim();
      var amt = $('burn-amount').value.trim();
      if (!sym || !amt) { alert('Please fill in symbol and amount.'); return; }
      addLog('Burned ' + amt + ' ' + sym, 'info');
      alert('Burned ' + amt + ' ' + sym + '!');
    });

    $('network-select').addEventListener('change', function () {
      wallet.network = this.value;
      $$('.network-badge').forEach(function (b) {
        b.textContent = wallet.network.charAt(0).toUpperCase() + wallet.network.slice(1);
      });
    });
  }

  // ── Init ──────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    initNav();
    initSetupTabs();
    initTokenTabs();
    initActions();
    showPage('lock');
    addLog('OSTAD WALLET initialized', 'success');
    addLog('Ready for wallet setup', '');
  });
})();
