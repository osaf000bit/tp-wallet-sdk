import { ProtocolRequest } from './types';
import { ValidationError } from './validation';

/** Default deeplink scheme used to launch the wallet. */
export const DEFAULT_SCHEME = 'tpoutside';

/** Default host segment of the deeplink. */
export const DEFAULT_HOST = 'pull.activity';

/** Query-string key holding the base64url encoded protocol request. */
export const PARAM_KEY = 'param';

/** Encode a UTF-8 string to base64url (no padding). */
export function toBase64Url(input: string): string {
  return Buffer.from(input, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/** Decode a base64url string back to UTF-8. */
export function fromBase64Url(input: string): string {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + '='.repeat(padLength);
  return Buffer.from(padded, 'base64').toString('utf8');
}

/** Options controlling deeplink generation. */
export interface DeeplinkOptions {
  scheme?: string;
  host?: string;
}

/**
 * Serialize a protocol request into a deeplink URL that launches the wallet.
 * The request JSON is base64url encoded and placed in the `param` query key.
 */
export function encodeDeeplink(
  request: ProtocolRequest,
  options: DeeplinkOptions = {}
): string {
  const scheme = options.scheme ?? DEFAULT_SCHEME;
  const host = options.host ?? DEFAULT_HOST;
  const encoded = toBase64Url(JSON.stringify(request));
  return `${scheme}://${host}?${PARAM_KEY}=${encoded}`;
}

/**
 * Serialize a protocol request into the raw payload used for QR codes.
 * Wallets scan this JSON string directly.
 */
export function encodeQrPayload(request: ProtocolRequest): string {
  return JSON.stringify(request);
}

/** Parse a protocol request out of a deeplink URL produced by {@link encodeDeeplink}. */
export function decodeDeeplink(url: string): ProtocolRequest {
  const withoutFragment = url.split('#')[0];
  const queryStart = withoutFragment.indexOf('?');
  if (queryStart === -1) {
    throw new ValidationError('deeplink is missing a query string');
  }
  const params = new URLSearchParams(withoutFragment.slice(queryStart + 1));
  const encoded = params.get(PARAM_KEY);
  if (encoded === null || encoded === '') {
    throw new ValidationError(`deeplink is missing the "${PARAM_KEY}" param`);
  }
  return parseRequestJson(fromBase64Url(encoded));
}

/** Parse and shallow-validate a protocol request from a JSON string. */
export function parseRequestJson(json: string): ProtocolRequest {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new ValidationError('request payload is not valid JSON');
  }
  if (parsed === null || typeof parsed !== 'object') {
    throw new ValidationError('request payload must be a JSON object');
  }
  const candidate = parsed as Record<string, unknown>;
  if (typeof candidate.action !== 'string') {
    throw new ValidationError('request payload is missing "action"');
  }
  if (typeof candidate.actionId !== 'string') {
    throw new ValidationError('request payload is missing "actionId"');
  }
  return parsed as ProtocolRequest;
}
