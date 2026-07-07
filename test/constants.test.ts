import {
  Blockchain,
  PROTOCOL_NAME,
  PROTOCOL_VERSION,
  SignType,
  SUPPORTED_BLOCKCHAINS,
  SUPPORTED_SIGN_TYPES,
  WalletAction
} from '../src/constants';

describe('constants', () => {
  it('exposes the protocol identity', () => {
    expect(PROTOCOL_NAME).toBe('TokenPocket');
    expect(PROTOCOL_VERSION).toBe('2.0');
  });

  it('enumerates wallet actions', () => {
    expect(WalletAction.Login).toBe('login');
    expect(WalletAction.Transfer).toBe('transfer');
    expect(WalletAction.Sign).toBe('sign');
    expect(WalletAction.PushTransaction).toBe('pushTransaction');
  });

  it('builds the supported blockchain set from the enum', () => {
    expect(SUPPORTED_BLOCKCHAINS.has(Blockchain.Evm)).toBe(true);
    expect(SUPPORTED_BLOCKCHAINS.size).toBe(Object.values(Blockchain).length);
  });

  it('builds the supported sign type set from the enum', () => {
    expect(SUPPORTED_SIGN_TYPES.has(SignType.EthSign)).toBe(true);
    expect(SUPPORTED_SIGN_TYPES.has(SignType.EthPersonalSign)).toBe(true);
    expect(SUPPORTED_SIGN_TYPES.size).toBe(Object.values(SignType).length);
  });
});
