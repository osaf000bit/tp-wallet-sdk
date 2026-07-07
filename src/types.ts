import { WalletAction } from './constants';

/**
 * A single EVM/EOSIO network descriptor used by the `blockchains` field.
 */
export interface BlockchainDescriptor {
  /** Chain id, e.g. "1" for Ethereum mainnet. */
  chainId: string;
  /** Human readable network name, e.g. "ethereum". */
  network: string;
}

/**
 * Fields shared by every protocol request.
 */
export interface BaseRequest {
  protocol: string;
  version: string;
  dappName?: string;
  dappIcon?: string;
  /** Legacy single-network field. */
  blockchain?: string;
  /** Preferred multi-network field for EVM / EOSIO. */
  blockchains?: BlockchainDescriptor[];
  action: WalletAction;
  actionId: string;
  callbackUrl?: string;
}

/** Authorize / login request. */
export interface AuthorizeRequest extends BaseRequest {
  action: WalletAction.Login;
}

/** Transfer request. */
export interface TransferRequest extends BaseRequest {
  action: WalletAction.Transfer;
  from?: string;
  to: string;
  amount: number;
  contract?: string;
  symbol?: string;
  /** EVM token decimals. */
  decimal?: number;
  /** EOS token precision. */
  precision?: number;
  memo?: string;
}

/** Sign-message request. */
export interface SignMessageRequest extends BaseRequest {
  action: WalletAction.Sign;
  message: string;
  signType?: string;
}

/** Sign-and-push common transaction request. */
export interface PushTransactionRequest extends BaseRequest {
  action: WalletAction.PushTransaction;
  /** IOST tx data. */
  payload?: string;
  /** EOS tx data. */
  actions?: string;
  /** EVM / TRON tx data. */
  txData?: string;
}

/** Union of all request kinds. */
export type ProtocolRequest =
  | AuthorizeRequest
  | TransferRequest
  | SignMessageRequest
  | PushTransactionRequest;

/**
 * Result posted back to a dapp via the callbackUrl (or returned inline).
 */
export interface CallbackResult<T = unknown> {
  actionId: string;
  action: string;
  /** True when the wallet reports success. */
  success: boolean;
  /** Action specific data (tx hash, signature, account, ...). */
  data?: T;
  /** Error message present when success is false. */
  error?: string;
}
