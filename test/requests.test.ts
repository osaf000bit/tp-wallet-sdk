import { PROTOCOL_NAME, PROTOCOL_VERSION, WalletAction } from '../src/constants';
import {
  buildAuthorizeRequest,
  buildPushTransactionRequest,
  buildSignMessageRequest,
  buildTransferRequest
} from '../src/requests';
import { ValidationError } from '../src/validation';

describe('buildAuthorizeRequest', () => {
  it('builds a login request with defaults', () => {
    const req = buildAuthorizeRequest({
      actionId: 'a1',
      blockchain: 'evm',
      callbackUrl: 'https://dapp.example/cb'
    });
    expect(req).toMatchObject({
      protocol: PROTOCOL_NAME,
      version: PROTOCOL_VERSION,
      action: WalletAction.Login,
      actionId: 'a1',
      blockchain: 'evm',
      callbackUrl: 'https://dapp.example/cb'
    });
  });

  it('supports blockchains[] and version override', () => {
    const req = buildAuthorizeRequest({
      actionId: 'a2',
      version: '2.1',
      dappName: 'Demo',
      dappIcon: 'https://dapp.example/icon.png',
      blockchains: [{ chainId: '1', network: 'ethereum' }]
    });
    expect(req.version).toBe('2.1');
    expect(req.dappName).toBe('Demo');
    expect(req.dappIcon).toBe('https://dapp.example/icon.png');
    expect(req.blockchains).toEqual([{ chainId: '1', network: 'ethereum' }]);
    expect(req.blockchain).toBeUndefined();
  });

  it('requires an actionId', () => {
    expect(() =>
      buildAuthorizeRequest({ actionId: '', blockchain: 'evm' })
    ).toThrow('"actionId" must be a non-empty string');
  });

  it('requires network targeting', () => {
    expect(() => buildAuthorizeRequest({ actionId: 'a3' })).toThrow(
      ValidationError
    );
  });
});

describe('buildTransferRequest', () => {
  const base = { actionId: 't1', blockchain: 'evm', to: '0xabc', amount: 1.5 };

  it('builds a transfer request with optional fields', () => {
    const req = buildTransferRequest({
      ...base,
      from: '0xdef',
      contract: '0xUSDT',
      symbol: 'USDT',
      decimal: 6,
      precision: 4,
      memo: 'gm'
    });
    expect(req).toMatchObject({
      action: WalletAction.Transfer,
      to: '0xabc',
      amount: 1.5,
      from: '0xdef',
      contract: '0xUSDT',
      symbol: 'USDT',
      decimal: 6,
      precision: 4,
      memo: 'gm'
    });
  });

  it('omits optional fields when not provided', () => {
    const req = buildTransferRequest(base);
    expect(req.from).toBeUndefined();
    expect(req.memo).toBeUndefined();
    expect(req.contract).toBeUndefined();
  });

  it('requires a recipient', () => {
    expect(() =>
      buildTransferRequest({ ...base, to: '' })
    ).toThrow('"to" must be a non-empty string');
  });

  it('requires a positive amount', () => {
    expect(() => buildTransferRequest({ ...base, amount: 0 })).toThrow(
      '"amount" must be a positive finite number'
    );
  });
});

describe('buildSignMessageRequest', () => {
  const base = { actionId: 's1', blockchain: 'evm', message: 'sign me' };

  it('builds a sign request', () => {
    const req = buildSignMessageRequest({ ...base, signType: 'ethSign' });
    expect(req).toMatchObject({
      action: WalletAction.Sign,
      message: 'sign me',
      signType: 'ethSign'
    });
  });

  it('omits signType when not provided', () => {
    const req = buildSignMessageRequest(base);
    expect(req.signType).toBeUndefined();
  });

  it('requires a message', () => {
    expect(() =>
      buildSignMessageRequest({ ...base, message: '' })
    ).toThrow('"message" must be a non-empty string');
  });

  it('rejects an unsupported signType', () => {
    expect(() =>
      buildSignMessageRequest({ ...base, signType: 'btcSign' })
    ).toThrow('unsupported signType "btcSign"');
  });
});

describe('buildPushTransactionRequest', () => {
  const base = { actionId: 'p1', blockchain: 'evm' };

  it('builds with txData (EVM/TRON)', () => {
    const req = buildPushTransactionRequest({ ...base, txData: '{"to":"0x"}' });
    expect(req).toMatchObject({
      action: WalletAction.PushTransaction,
      txData: '{"to":"0x"}'
    });
    expect(req.payload).toBeUndefined();
    expect(req.actions).toBeUndefined();
  });

  it('builds with payload (IOST)', () => {
    const req = buildPushTransactionRequest({ ...base, payload: 'iost-data' });
    expect(req.payload).toBe('iost-data');
  });

  it('builds with actions (EOS)', () => {
    const req = buildPushTransactionRequest({ ...base, actions: 'eos-data' });
    expect(req.actions).toBe('eos-data');
  });

  it('requires exactly one tx data field', () => {
    expect(() => buildPushTransactionRequest(base)).toThrow(
      'one of "payload", "actions" or "txData" is required'
    );
  });

  it('rejects more than one tx data field', () => {
    expect(() =>
      buildPushTransactionRequest({ ...base, payload: 'a', txData: 'b' })
    ).toThrow('provide only one of "payload", "actions" or "txData"');
  });

  it('rejects an empty tx data field', () => {
    expect(() =>
      buildPushTransactionRequest({ ...base, txData: '' })
    ).toThrow('"txData" must be a non-empty string');
  });
});
