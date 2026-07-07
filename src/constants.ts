/**
 * Protocol-level constants for the TokenPocket wallet protocol.
 */

/** The protocol name every request must carry. */
export const PROTOCOL_NAME = 'TokenPocket';

/** The protocol version implemented by this SDK. */
export const PROTOCOL_VERSION = '2.0';

/** Supported wallet actions. */
export enum WalletAction {
  Login = 'login',
  Transfer = 'transfer',
  Sign = 'sign',
  PushTransaction = 'pushTransaction'
}

/** Blockchain families understood by the protocol. */
export enum Blockchain {
  Eos = 'eos',
  Evm = 'evm',
  Tron = 'tron',
  Iost = 'iost'
}

/** Signature schemes supported for EVM `sign` actions. */
export enum SignType {
  EthSign = 'ethSign',
  EthPersonalSign = 'ethPersonalSign'
}

/** All blockchain values as a lookup set. */
export const SUPPORTED_BLOCKCHAINS: ReadonlySet<string> = new Set(
  Object.values(Blockchain)
);

/** All sign types as a lookup set. */
export const SUPPORTED_SIGN_TYPES: ReadonlySet<string> = new Set(
  Object.values(SignType)
);
