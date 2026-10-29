import {
  createDappRegexMatcher,
  MAX_DAPP_REGEX_PATTERN_LENGTH,
} from './dappRegex';

describe('createDappRegexMatcher', () => {
  it.each([
    '^0x[a-fA-F0-9]{40}$',
    '^ethereum:(0x[0-9a-f]{40})(@\\d+)?(\\?.*)?$',
    '.*',
    '^(?:foo|bar)$',
    '^[a-z*+?(){}|]+$',
    '\\(a+\\)+',
  ])('accepts and matches with safe pattern %s', (pattern) => {
    const match = createDappRegexMatcher(pattern);
    expect(() => match('ethereum:0xabc')).not.toThrow();
  });

  it('returns the RegExp exec result', () => {
    const match = createDappRegexMatcher('^ab(c)$');
    expect(match('abc')?.[1]).toBe('c');
    expect(match('abd')).toBeNull();
  });

  it.each([undefined, null, 42, {}, ['a']])(
    'rejects non-string pattern %p',
    (pattern) => {
      expect(() => createDappRegexMatcher(pattern)).toThrow(
        'Regular expression must be a string',
      );
    },
  );

  it('rejects patterns longer than the maximum length', () => {
    expect(() =>
      createDappRegexMatcher('a'.repeat(MAX_DAPP_REGEX_PATTERN_LENGTH + 1)),
    ).toThrow('exceeds');
  });

  it('rejects patterns that fail to compile', () => {
    expect(() => createDappRegexMatcher('(')).toThrow(
      'Invalid regular expression',
    );
    expect(() => createDappRegexMatcher('[')).toThrow(
      'Invalid regular expression',
    );
  });

  it.each([
    '^(([a-z]*)*)*$',
    '(a+)+$',
    '(a*)*b',
    '(a?)+',
    '(\\d+){2,}',
    '(a|aa)+$',
    '(?:x|y)*z',
    '(a{1,5})*',
  ])('rejects catastrophic nested repetition %s', (pattern) => {
    expect(() => createDappRegexMatcher(pattern)).toThrow(
      'Nested or ambiguous repetition is not allowed',
    );
  });

  it.each(['(a)\\1', '(?<x>a)\\k<x>'])(
    'rejects backreferences %s',
    (pattern) => {
      expect(() => createDappRegexMatcher(pattern)).toThrow(
        'Backreferences are not allowed',
      );
    },
  );

  it('refuses to run polynomially backtracking patterns on long input', () => {
    const match = createDappRegexMatcher('^a*a*a*a*b$');
    expect(match('aaab')).not.toBeNull();
    expect(() => match(`${'a'.repeat(4000)}1`)).toThrow('too complex');
  });

  it('refuses long chains of optional atoms', () => {
    const match = createDappRegexMatcher(
      `^${'a?'.repeat(30)}${'a'.repeat(30)}$`,
    );
    expect(() => match('a'.repeat(30))).toThrow('too complex');
  });

  it('fails fast on the reported ReDoS payload', () => {
    const start = Date.now();
    expect(() => createDappRegexMatcher('^(([a-z]*)*)*$')).toThrow();
    expect(Date.now() - start).toBeLessThan(100);
  });
});
