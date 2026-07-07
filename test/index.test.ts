import {
  TpWalletSdk,
  WalletAction,
  buildTransferRequest,
  parseCallbackResult
} from '../src/index';

describe('index barrel exports', () => {
  it('re-exports builders and helpers', () => {
    expect(typeof buildTransferRequest).toBe('function');
    expect(typeof parseCallbackResult).toBe('function');
  });
});

describe('TpWalletSdk', () => {
  const sdk = new TpWalletSdk({
    dappName: 'Demo DApp',
    dappIcon: 'https://dapp.example/icon.png',
    deeplink: { scheme: 'mywallet', host: 'open' }
  });

  it('injects shared dapp metadata into requests', () => {
    const req = sdk.authorize({ actionId: 'a1', blockchain: 'evm' });
    expect(req.dappName).toBe('Demo DApp');
    expect(req.dappIcon).toBe('https://dapp.example/icon.png');
    expect(req.action).toBe(WalletAction.Login);
  });

  it('lets per-call metadata override the defaults', () => {
    const req = sdk.transfer({
      actionId: 't1',
      blockchain: 'evm',
      to: '0xabc',
      amount: 1,
      dappName: 'Override',
      dappIcon: 'https://override.example/icon.png'
    });
    expect(req.dappName).toBe('Override');
    expect(req.dappIcon).toBe('https://override.example/icon.png');
  });

  it('builds sign and push requests', () => {
    const sign = sdk.signMessage({
      actionId: 's1',
      blockchain: 'evm',
      message: 'hi'
    });
    expect(sign.action).toBe(WalletAction.Sign);

    const push = sdk.pushTransaction({
      actionId: 'p1',
      blockchain: 'evm',
      txData: '{}'
    });
    expect(push.action).toBe(WalletAction.PushTransaction);
  });

  it('encodes requests to deeplinks using configured defaults', () => {
    const req = sdk.authorize({ actionId: 'a2', blockchain: 'evm' });
    const url = sdk.toDeeplink(req);
    expect(url.startsWith('mywallet://open?')).toBe(true);
  });

  it('encodes requests to QR payloads', () => {
    const req = sdk.authorize({ actionId: 'a3', blockchain: 'evm' });
    expect(sdk.toQrPayload(req)).toBe(JSON.stringify(req));
  });

  it('works with default (empty) config', () => {
    const bare = new TpWalletSdk();
    const req = bare.authorize({ actionId: 'a4', blockchain: 'evm' });
    expect(req.dappName).toBeUndefined();
    expect(bare.toDeeplink(req).startsWith('tpoutside://')).toBe(true);
  });
});
