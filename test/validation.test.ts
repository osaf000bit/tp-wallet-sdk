import {
  assertNonEmptyString,
  assertPositiveNumber,
  isSupportedBlockchain,
  isSupportedSignType,
  validateBlockchainDescriptor,
  validateNetworkTargeting,
  ValidationError
} from '../src/validation';

describe('assertNonEmptyString', () => {
  it('returns the value for a valid string', () => {
    expect(assertNonEmptyString('hello', 'field')).toBe('hello');
  });

  it.each([['', 'empty'], ['   ', 'whitespace']])(
    'throws for %s strings',
    (value) => {
      expect(() => assertNonEmptyString(value, 'field')).toThrow(
        ValidationError
      );
    }
  );

  it.each([[undefined], [null], [42], [{}]])(
    'throws for non-string value %p',
    (value) => {
      expect(() => assertNonEmptyString(value, 'field')).toThrow(
        '"field" must be a non-empty string'
      );
    }
  );
});

describe('assertPositiveNumber', () => {
  it('returns the value for a positive number', () => {
    expect(assertPositiveNumber(1.5, 'amount')).toBe(1.5);
  });

  it.each([[0], [-1], [Number.NaN], [Number.POSITIVE_INFINITY], ['1'], [null]])(
    'throws for invalid number %p',
    (value) => {
      expect(() => assertPositiveNumber(value, 'amount')).toThrow(
        ValidationError
      );
    }
  );
});

describe('isSupportedBlockchain', () => {
  it('recognizes supported chains', () => {
    expect(isSupportedBlockchain('evm')).toBe(true);
    expect(isSupportedBlockchain('eos')).toBe(true);
    expect(isSupportedBlockchain('tron')).toBe(true);
    expect(isSupportedBlockchain('iost')).toBe(true);
  });

  it('rejects unknown chains', () => {
    expect(isSupportedBlockchain('solana')).toBe(false);
  });
});

describe('isSupportedSignType', () => {
  it('recognizes supported sign types', () => {
    expect(isSupportedSignType('ethSign')).toBe(true);
    expect(isSupportedSignType('ethPersonalSign')).toBe(true);
  });

  it('rejects unknown sign types', () => {
    expect(isSupportedSignType('btcSign')).toBe(false);
  });
});

describe('validateBlockchainDescriptor', () => {
  it('accepts a valid descriptor', () => {
    expect(() =>
      validateBlockchainDescriptor({ chainId: '1', network: 'ethereum' }, 0)
    ).not.toThrow();
  });

  it('rejects non-object descriptors', () => {
    // @ts-expect-error testing runtime guard
    expect(() => validateBlockchainDescriptor(null, 0)).toThrow(
      '"blockchains[0]" must be an object'
    );
  });

  it('rejects missing chainId', () => {
    expect(() =>
      // @ts-expect-error testing runtime guard
      validateBlockchainDescriptor({ network: 'ethereum' }, 2)
    ).toThrow('blockchains[2].chainId');
  });
});

describe('validateNetworkTargeting', () => {
  it('accepts a single supported blockchain', () => {
    expect(() => validateNetworkTargeting({ blockchain: 'evm' })).not.toThrow();
  });

  it('accepts a non-empty blockchains array', () => {
    expect(() =>
      validateNetworkTargeting({
        blockchains: [{ chainId: '1', network: 'ethereum' }]
      })
    ).not.toThrow();
  });

  it('throws when neither field is provided', () => {
    expect(() => validateNetworkTargeting({})).toThrow(
      'either "blockchain" or a non-empty "blockchains" array is required'
    );
  });

  it('throws when the blockchains array is empty', () => {
    expect(() => validateNetworkTargeting({ blockchains: [] })).toThrow(
      ValidationError
    );
  });

  it('throws when both fields are provided', () => {
    expect(() =>
      validateNetworkTargeting({
        blockchain: 'evm',
        blockchains: [{ chainId: '1', network: 'ethereum' }]
      })
    ).toThrow('provide only one of "blockchain" or "blockchains", not both');
  });

  it('throws for an unsupported blockchain', () => {
    expect(() => validateNetworkTargeting({ blockchain: 'solana' })).toThrow(
      'unsupported blockchain "solana"'
    );
  });

  it('validates each descriptor in the array', () => {
    expect(() =>
      validateNetworkTargeting({
        // @ts-expect-error testing runtime guard
        blockchains: [{ chainId: '1' }]
      })
    ).toThrow('blockchains[0].network');
  });
});
