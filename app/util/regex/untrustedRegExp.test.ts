import {
  compileUntrustedRegExp,
  MAX_UNTRUSTED_INPUT_LENGTH,
  MAX_UNTRUSTED_PATTERN_LENGTH,
  UntrustedRegExpError,
} from './untrustedRegExp';

describe('compileUntrustedRegExp', () => {
  it.each([
    '^0x[0-9a-fA-F]{40}$',
    '^(ethereum:)?0x[0-9a-fA-F]{40}',
    '^ethereum:.*$',
    '^wc:[a-z0-9-]+@2\\?',
    'foo|bar|baz',
    '^[A-Z]{3}-\\d{4}$',
    '',
  ])('compiles bounded pattern %p', (pattern) => {
    const compiled = compileUntrustedRegExp(pattern);
    expect(compiled).toBeInstanceOf(RegExp);
    expect(compiled.source).toBe(new RegExp(pattern).source);
  });

  it.each([
    ['^(([a-z]*)*)*$', /quantified groups/],
    ['^(a+)+$', /quantified groups/],
    ['(a|a)*$', /quantified groups/],
    ['((a|b))+$', /quantified groups/],
    ['(?:x[a-z]?)*', /quantified groups/],
    ['[a-z]*[a-z]*$', /too many repetitions/],
    ['.*a.*b', /too many repetitions/],
    ['\\d+\\d{0,5}$', /too many repetitions/],
    ['a{0,99999}b', /too many repetitions/],
    ['^(a)\\1$', /backreferences/],
    ['^(?<x>a)\\k<x>$', /backreferences/],
    ['^(?=a)a', /lookarounds/],
    ['^(?<!a)b', /lookarounds/],
    ['(', /does not compile/],
    ['a'.repeat(MAX_UNTRUSTED_PATTERN_LENGTH + 1), /exceeds/],
  ])('rejects %p', (pattern, reason) => {
    expect(() => compileUntrustedRegExp(pattern)).toThrow(UntrustedRegExpError);
    expect(() => compileUntrustedRegExp(pattern)).toThrow(reason);
  });

  it.each([undefined, null, 1, {}, ['^a']])(
    'rejects non-string %p',
    (pattern) => {
      expect(() => compileUntrustedRegExp(pattern)).toThrow(
        'pattern must be a string',
      );
    },
  );

  it('treats escaped and bracketed metacharacters as literals', () => {
    expect(() => compileUntrustedRegExp('^\\(a\\*\\)+$')).not.toThrow();
    expect(() => compileUntrustedRegExp('^[(*+|)]+$')).not.toThrow();
    expect(() => compileUntrustedRegExp('^a{,2}$')).not.toThrow();
  });

  it('matches accepted worst-case patterns quickly at the maximum input length', () => {
    const input = `${'a'.repeat(MAX_UNTRUSTED_INPUT_LENGTH - 1)}1`;
    for (const pattern of [
      '[a-z]*$',
      '[a-z]+[a-z]?$',
      '^[a-z]*[a-z]?[a-z]?$',
    ]) {
      const compiled = compileUntrustedRegExp(pattern);
      const start = Date.now();
      compiled.test(input);
      expect(Date.now() - start).toBeLessThan(1000);
    }
  });
});
