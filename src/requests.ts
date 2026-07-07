import { PROTOCOL_NAME, PROTOCOL_VERSION, WalletAction } from './constants';
import {
  AuthorizeRequest,
  BaseRequest,
  BlockchainDescriptor,
  PushTransactionRequest,
  SignMessageRequest,
  TransferRequest
} from './types';
import {
  assertNonEmptyString,
  assertPositiveNumber,
  isSupportedSignType,
  validateNetworkTargeting,
  ValidationError
} from './validation';

/** Options common to every request builder. */
export interface CommonOptions {
  dappName?: string;
  dappIcon?: string;
  blockchain?: string;
  blockchains?: BlockchainDescriptor[];
  actionId: string;
  callbackUrl?: string;
  /** Override the default protocol version. */
  version?: string;
}

function buildBase(
  action: WalletAction,
  options: CommonOptions
): BaseRequest {
  assertNonEmptyString(options.actionId, 'actionId');
  validateNetworkTargeting(options);

  const base: BaseRequest = {
    protocol: PROTOCOL_NAME,
    version: options.version ?? PROTOCOL_VERSION,
    action,
    actionId: options.actionId
  };

  if (options.dappName !== undefined) base.dappName = options.dappName;
  if (options.dappIcon !== undefined) base.dappIcon = options.dappIcon;
  if (options.blockchain !== undefined) base.blockchain = options.blockchain;
  if (options.blockchains !== undefined) base.blockchains = options.blockchains;
  if (options.callbackUrl !== undefined) base.callbackUrl = options.callbackUrl;

  return base;
}

/** Build an authorize / login request. */
export function buildAuthorizeRequest(
  options: CommonOptions
): AuthorizeRequest {
  return {
    ...buildBase(WalletAction.Login, options),
    action: WalletAction.Login
  };
}

/** Fields specific to a transfer request. */
export interface TransferOptions extends CommonOptions {
  from?: string;
  to: string;
  amount: number;
  contract?: string;
  symbol?: string;
  decimal?: number;
  precision?: number;
  memo?: string;
}

/** Build a transfer request. */
export function buildTransferRequest(
  options: TransferOptions
): TransferRequest {
  const base = buildBase(WalletAction.Transfer, options);
  assertNonEmptyString(options.to, 'to');
  assertPositiveNumber(options.amount, 'amount');

  const request: TransferRequest = {
    ...base,
    action: WalletAction.Transfer,
    to: options.to,
    amount: options.amount
  };

  if (options.from !== undefined) request.from = options.from;
  if (options.contract !== undefined) request.contract = options.contract;
  if (options.symbol !== undefined) request.symbol = options.symbol;
  if (options.decimal !== undefined) request.decimal = options.decimal;
  if (options.precision !== undefined) request.precision = options.precision;
  if (options.memo !== undefined) request.memo = options.memo;

  return request;
}

/** Fields specific to a sign-message request. */
export interface SignMessageOptions extends CommonOptions {
  message: string;
  signType?: string;
}

/** Build a sign-message request. */
export function buildSignMessageRequest(
  options: SignMessageOptions
): SignMessageRequest {
  const base = buildBase(WalletAction.Sign, options);
  assertNonEmptyString(options.message, 'message');

  if (options.signType !== undefined && !isSupportedSignType(options.signType)) {
    throw new ValidationError(`unsupported signType "${options.signType}"`);
  }

  const request: SignMessageRequest = {
    ...base,
    action: WalletAction.Sign,
    message: options.message
  };

  if (options.signType !== undefined) request.signType = options.signType;

  return request;
}

/** Fields specific to a push-transaction request. */
export interface PushTransactionOptions extends CommonOptions {
  payload?: string;
  actions?: string;
  txData?: string;
}

/** Build a sign-and-push common transaction request. */
export function buildPushTransactionRequest(
  options: PushTransactionOptions
): PushTransactionRequest {
  const base = buildBase(WalletAction.PushTransaction, options);

  const provided = [options.payload, options.actions, options.txData].filter(
    (v) => v !== undefined
  );
  if (provided.length === 0) {
    throw new ValidationError(
      'one of "payload", "actions" or "txData" is required'
    );
  }
  if (provided.length > 1) {
    throw new ValidationError(
      'provide only one of "payload", "actions" or "txData"'
    );
  }
  if (options.payload !== undefined) assertNonEmptyString(options.payload, 'payload');
  if (options.actions !== undefined) assertNonEmptyString(options.actions, 'actions');
  if (options.txData !== undefined) assertNonEmptyString(options.txData, 'txData');

  const request: PushTransactionRequest = {
    ...base,
    action: WalletAction.PushTransaction
  };

  if (options.payload !== undefined) request.payload = options.payload;
  if (options.actions !== undefined) request.actions = options.actions;
  if (options.txData !== undefined) request.txData = options.txData;

  return request;
}
