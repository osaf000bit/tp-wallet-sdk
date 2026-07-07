export * from './constants';
export * from './types';
export * from './validation';
export * from './requests';
export * from './encoding';
export * from './callback';

import { CommonOptions } from './requests';
import {
  buildAuthorizeRequest,
  buildPushTransactionRequest,
  buildSignMessageRequest,
  buildTransferRequest,
  PushTransactionOptions,
  SignMessageOptions,
  TransferOptions
} from './requests';
import { DeeplinkOptions, encodeDeeplink, encodeQrPayload } from './encoding';
import { ProtocolRequest } from './types';

/** Configuration shared across every request built by a {@link TpWalletSdk}. */
export interface TpWalletSdkConfig {
  dappName?: string;
  dappIcon?: string;
  /** Optional default scheme/host for generated deeplinks. */
  deeplink?: DeeplinkOptions;
}

/**
 * Thin convenience wrapper that injects shared dapp metadata into every
 * request and exposes helpers to turn requests into deeplinks / QR payloads.
 */
export class TpWalletSdk {
  constructor(private readonly config: TpWalletSdkConfig = {}) {}

  private withDefaults<T extends CommonOptions>(options: T): T {
    return {
      ...options,
      dappName: options.dappName ?? this.config.dappName,
      dappIcon: options.dappIcon ?? this.config.dappIcon
    };
  }

  authorize(options: CommonOptions) {
    return buildAuthorizeRequest(this.withDefaults(options));
  }

  transfer(options: TransferOptions) {
    return buildTransferRequest(this.withDefaults(options));
  }

  signMessage(options: SignMessageOptions) {
    return buildSignMessageRequest(this.withDefaults(options));
  }

  pushTransaction(options: PushTransactionOptions) {
    return buildPushTransactionRequest(this.withDefaults(options));
  }

  /** Encode any request into a wallet deeplink using the configured defaults. */
  toDeeplink(request: ProtocolRequest): string {
    return encodeDeeplink(request, this.config.deeplink);
  }

  /** Encode any request into a QR payload string. */
  toQrPayload(request: ProtocolRequest): string {
    return encodeQrPayload(request);
  }
}
