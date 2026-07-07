import { CallbackResult } from './types';
import { ValidationError } from './validation';

/**
 * Parse a callback result posted back by the wallet.
 *
 * Accepts either an already-parsed object or a JSON string. Normalizes the
 * `success` flag which some wallet versions send as a string ("true"/"1").
 */
export function parseCallbackResult<T = unknown>(
  input: string | Record<string, unknown>
): CallbackResult<T> {
  let obj: Record<string, unknown>;
  if (typeof input === 'string') {
    let parsed: unknown;
    try {
      parsed = JSON.parse(input);
    } catch {
      throw new ValidationError('callback result is not valid JSON');
    }
    if (parsed === null || typeof parsed !== 'object') {
      throw new ValidationError('callback result must be a JSON object');
    }
    obj = parsed as Record<string, unknown>;
  } else if (input !== null && typeof input === 'object') {
    obj = input;
  } else {
    throw new ValidationError('callback result must be a string or object');
  }

  if (typeof obj.actionId !== 'string' || obj.actionId === '') {
    throw new ValidationError('callback result is missing "actionId"');
  }
  if (typeof obj.action !== 'string' || obj.action === '') {
    throw new ValidationError('callback result is missing "action"');
  }

  const result: CallbackResult<T> = {
    actionId: obj.actionId,
    action: obj.action,
    success: normalizeSuccess(obj.success)
  };

  if (obj.data !== undefined) {
    result.data = obj.data as T;
  }
  if (typeof obj.error === 'string' && obj.error !== '') {
    result.error = obj.error;
  }

  return result;
}

/** Coerce the various shapes wallets use for the success flag into a boolean. */
export function normalizeSuccess(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    return value === 'true' || value === '1';
  }
  return false;
}
