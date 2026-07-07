import {
  Blockchain,
  SUPPORTED_BLOCKCHAINS,
  SUPPORTED_SIGN_TYPES
} from './constants';
import { BlockchainDescriptor } from './types';

/** Error thrown when a request fails validation. */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/** Assert that a value is a non-empty string. */
export function assertNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ValidationError(`"${field}" must be a non-empty string`);
  }
  return value;
}

/** Assert that a value is a finite, positive number. */
export function assertPositiveNumber(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new ValidationError(`"${field}" must be a positive finite number`);
  }
  return value;
}

/** Return true when the string is a known blockchain family. */
export function isSupportedBlockchain(value: string): value is Blockchain {
  return SUPPORTED_BLOCKCHAINS.has(value);
}

/** Return true when the string is a supported EVM sign type. */
export function isSupportedSignType(value: string): boolean {
  return SUPPORTED_SIGN_TYPES.has(value);
}

/** Validate a single blockchains[] descriptor. */
export function validateBlockchainDescriptor(
  descriptor: BlockchainDescriptor,
  index: number
): void {
  if (descriptor === null || typeof descriptor !== 'object') {
    throw new ValidationError(`"blockchains[${index}]" must be an object`);
  }
  assertNonEmptyString(descriptor.chainId, `blockchains[${index}].chainId`);
  assertNonEmptyString(descriptor.network, `blockchains[${index}].network`);
}

/**
 * Validate the network targeting fields. Exactly one of `blockchain` or a
 * non-empty `blockchains` array must be present.
 */
export function validateNetworkTargeting(input: {
  blockchain?: string;
  blockchains?: BlockchainDescriptor[];
}): void {
  const hasBlockchain =
    input.blockchain !== undefined && input.blockchain !== null;
  const hasBlockchains =
    Array.isArray(input.blockchains) && input.blockchains.length > 0;

  if (!hasBlockchain && !hasBlockchains) {
    throw new ValidationError(
      'either "blockchain" or a non-empty "blockchains" array is required'
    );
  }

  if (hasBlockchain && hasBlockchains) {
    throw new ValidationError(
      'provide only one of "blockchain" or "blockchains", not both'
    );
  }

  if (hasBlockchain) {
    const value = assertNonEmptyString(input.blockchain, 'blockchain');
    if (!isSupportedBlockchain(value)) {
      throw new ValidationError(`unsupported blockchain "${value}"`);
    }
    return;
  }

  (input.blockchains as BlockchainDescriptor[]).forEach((d, i) =>
    validateBlockchainDescriptor(d, i)
  );
}
