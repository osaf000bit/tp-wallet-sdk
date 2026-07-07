// Browser build of the TokenPocket deeplink helpers, mirroring the repo SDK
// (src/constants.ts, src/requests.ts, src/encoding.ts).
(function (global) {
  'use strict';

  var PROTOCOL_NAME = 'TokenPocket';
  var PROTOCOL_VERSION = '2.0';
  var DEFAULT_SCHEME = 'tpoutside';
  var DEFAULT_HOST = 'pull.activity';
  var PARAM_KEY = 'param';

  function toBase64Url(str) {
    // UTF-8 safe base64, then url-safe, no padding.
    var b64 = btoa(unescape(encodeURIComponent(str)));
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function baseRequest(action, opts) {
    if (!opts.actionId) throw new Error('actionId is required');
    if (!opts.blockchain && !(opts.blockchains && opts.blockchains.length)) {
      throw new Error('blockchain or blockchains is required');
    }
    var req = {
      protocol: PROTOCOL_NAME,
      version: opts.version || PROTOCOL_VERSION,
      action: action,
      actionId: opts.actionId
    };
    if (opts.dappName) req.dappName = opts.dappName;
    if (opts.dappIcon) req.dappIcon = opts.dappIcon;
    if (opts.blockchain) req.blockchain = opts.blockchain;
    if (opts.blockchains) req.blockchains = opts.blockchains;
    if (opts.callbackUrl) req.callbackUrl = opts.callbackUrl;
    return req;
  }

  function buildAuthorizeRequest(opts) {
    return baseRequest('login', opts);
  }

  function buildTransferRequest(opts) {
    if (!opts.to) throw new Error('to is required');
    if (!(typeof opts.amount === 'number' && opts.amount > 0)) {
      throw new Error('amount must be a positive number');
    }
    var req = baseRequest('transfer', opts);
    req.to = opts.to;
    req.amount = opts.amount;
    if (opts.contract) req.contract = opts.contract;
    if (opts.symbol) req.symbol = opts.symbol;
    if (opts.decimal !== undefined) req.decimal = opts.decimal;
    if (opts.memo) req.memo = opts.memo;
    return req;
  }

  function encodeDeeplink(request, options) {
    options = options || {};
    var scheme = options.scheme || DEFAULT_SCHEME;
    var host = options.host || DEFAULT_HOST;
    var encoded = toBase64Url(JSON.stringify(request));
    return scheme + '://' + host + '?' + PARAM_KEY + '=' + encoded;
  }

  global.TpWalletBrowser = {
    buildAuthorizeRequest: buildAuthorizeRequest,
    buildTransferRequest: buildTransferRequest,
    encodeDeeplink: encodeDeeplink,
    toBase64Url: toBase64Url
  };
})(window);
