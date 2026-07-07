import { normalizeSuccess, parseCallbackResult } from '../src/callback';

describe('normalizeSuccess', () => {
  it.each([
    [true, true],
    [false, false],
    [1, true],
    [0, false],
    ['true', true],
    ['1', true],
    ['false', false],
    ['nope', false],
    [undefined, false],
    [null, false],
    [{}, false]
  ])('normalizes %p to %p', (input, expected) => {
    expect(normalizeSuccess(input)).toBe(expected);
  });
});

describe('parseCallbackResult', () => {
  it('parses a successful result object', () => {
    const result = parseCallbackResult<{ txHash: string }>({
      actionId: 'a1',
      action: 'transfer',
      success: true,
      data: { txHash: '0xdead' }
    });
    expect(result).toEqual({
      actionId: 'a1',
      action: 'transfer',
      success: true,
      data: { txHash: '0xdead' }
    });
  });

  it('parses a JSON string result', () => {
    const result = parseCallbackResult(
      '{"actionId":"a2","action":"login","success":"1"}'
    );
    expect(result.success).toBe(true);
    expect(result.actionId).toBe('a2');
  });

  it('captures an error message on failure', () => {
    const result = parseCallbackResult({
      actionId: 'a3',
      action: 'sign',
      success: false,
      error: 'user rejected'
    });
    expect(result.success).toBe(false);
    expect(result.error).toBe('user rejected');
  });

  it('ignores empty error strings', () => {
    const result = parseCallbackResult({
      actionId: 'a4',
      action: 'sign',
      success: true,
      error: ''
    });
    expect(result.error).toBeUndefined();
  });

  it('defaults success to false when omitted', () => {
    const result = parseCallbackResult({ actionId: 'a5', action: 'login' });
    expect(result.success).toBe(false);
    expect(result.data).toBeUndefined();
  });

  it('throws on invalid JSON', () => {
    expect(() => parseCallbackResult('{bad')).toThrow(
      'callback result is not valid JSON'
    );
  });

  it('throws when the JSON is not an object', () => {
    expect(() => parseCallbackResult('123')).toThrow(
      'callback result must be a JSON object'
    );
  });

  it('throws when input is neither string nor object', () => {
    // @ts-expect-error testing runtime guard
    expect(() => parseCallbackResult(42)).toThrow(
      'callback result must be a string or object'
    );
  });

  it('throws when actionId is missing', () => {
    expect(() => parseCallbackResult({ action: 'login' })).toThrow(
      'callback result is missing "actionId"'
    );
  });

  it('throws when action is missing', () => {
    expect(() => parseCallbackResult({ actionId: 'a6' })).toThrow(
      'callback result is missing "action"'
    );
  });
});
