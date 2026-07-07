import { WalletAction } from '../src/constants';
import {
  DEFAULT_HOST,
  DEFAULT_SCHEME,
  PARAM_KEY,
  decodeDeeplink,
  encodeDeeplink,
  encodeQrPayload,
  fromBase64Url,
  parseRequestJson,
  toBase64Url
} from '../src/encoding';
import { buildAuthorizeRequest } from '../src/requests';
import { ProtocolRequest } from '../src/types';
import { ValidationError } from '../src/validation';

const sampleRequest = buildAuthorizeRequest({
  actionId: 'a1',
  blockchain: 'evm',
  callbackUrl: 'https://dapp.example/cb'
});

describe('base64url', () => {
  it('round-trips arbitrary unicode strings', () => {
    const original = 'hello 世界 🌍 + / =';
    expect(fromBase64Url(toBase64Url(original))).toBe(original);
  });

  it('produces url-safe output without padding', () => {
    const encoded = toBase64Url('????>>>>');
    expect(encoded).not.toMatch(/[+/=]/);
  });
});

describe('encodeDeeplink / decodeDeeplink', () => {
  it('produces a deeplink with the default scheme and host', () => {
    const url = encodeDeeplink(sampleRequest);
    expect(url.startsWith(`${DEFAULT_SCHEME}://${DEFAULT_HOST}?${PARAM_KEY}=`)).toBe(
      true
    );
  });

  it('honors custom scheme and host', () => {
    const url = encodeDeeplink(sampleRequest, {
      scheme: 'mywallet',
      host: 'open'
    });
    expect(url.startsWith('mywallet://open?')).toBe(true);
  });

  it('round-trips a request through encode/decode', () => {
    const url = encodeDeeplink(sampleRequest);
    const decoded = decodeDeeplink(url);
    expect(decoded).toEqual(sampleRequest);
  });

  it('throws when the url has no query string', () => {
    expect(() => decodeDeeplink('tpoutside://pull.activity')).toThrow(
      'deeplink is missing a query string'
    );
  });

  it('throws when the param key is absent', () => {
    expect(() => decodeDeeplink('tpoutside://pull.activity?foo=bar')).toThrow(
      `deeplink is missing the "${PARAM_KEY}" param`
    );
  });

  it('ignores a trailing url fragment when decoding', () => {
    const url = `${encodeDeeplink(sampleRequest)}#section`;
    const decoded = decodeDeeplink(url);
    expect(decoded).toEqual(sampleRequest);
  });
});

describe('encodeQrPayload', () => {
  it('returns the JSON serialization of the request', () => {
    expect(encodeQrPayload(sampleRequest)).toBe(JSON.stringify(sampleRequest));
  });
});

describe('parseRequestJson', () => {
  it('parses a valid request payload', () => {
    const json = JSON.stringify(sampleRequest);
    const parsed = parseRequestJson(json) as ProtocolRequest;
    expect(parsed.action).toBe(WalletAction.Login);
    expect(parsed.actionId).toBe('a1');
  });

  it('throws on invalid JSON', () => {
    expect(() => parseRequestJson('{not json')).toThrow(
      'request payload is not valid JSON'
    );
  });

  it('throws when payload is not an object', () => {
    expect(() => parseRequestJson('42')).toThrow(
      'request payload must be a JSON object'
    );
  });

  it('throws on null payload', () => {
    expect(() => parseRequestJson('null')).toThrow(ValidationError);
  });

  it('throws when action is missing', () => {
    expect(() => parseRequestJson('{"actionId":"a1"}')).toThrow(
      'request payload is missing "action"'
    );
  });

  it('throws when actionId is missing', () => {
    expect(() => parseRequestJson('{"action":"login"}')).toThrow(
      'request payload is missing "actionId"'
    );
  });
});
