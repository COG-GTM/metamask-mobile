import {
  isPotentiallyCatastrophicRegex,
  safeRegexExec,
} from './safeRegexExec';

describe('isPotentiallyCatastrophicRegex', () => {
  it('flags nested unbounded quantifiers', () => {
    expect(isPotentiallyCatastrophicRegex('(a+)+')).toBe(true);
    expect(isPotentiallyCatastrophicRegex('(a*)*')).toBe(true);
    expect(isPotentiallyCatastrophicRegex('(a+)+$')).toBe(true);
    expect(isPotentiallyCatastrophicRegex('((ab)+)+')).toBe(true);
    expect(isPotentiallyCatastrophicRegex('(a+)*')).toBe(true);
  });

  it('does not flag safe patterns', () => {
    expect(isPotentiallyCatastrophicRegex('^0x[0-9a-fA-F]{40}$')).toBe(false);
    expect(isPotentiallyCatastrophicRegex('(abc)+')).toBe(false);
    expect(isPotentiallyCatastrophicRegex('a+b+c+')).toBe(false);
    expect(isPotentiallyCatastrophicRegex('[a-z]+')).toBe(false);
    expect(isPotentiallyCatastrophicRegex('(a+)?')).toBe(false);
  });

  it('does not treat quantifier chars inside a character class as quantifiers', () => {
    expect(isPotentiallyCatastrophicRegex('([+*]+)')).toBe(false);
  });
});

describe('safeRegexExec', () => {
  it('matches like RegExp.exec for safe patterns', () => {
    const result = safeRegexExec('^(\\d+)$', '123');
    expect(result).not.toBeNull();
    expect(result?.[1]).toBe('123');
  });

  it('returns null (no match) rather than hanging for catastrophic patterns', () => {
    const start = Date.now();
    const result = safeRegexExec('(a+)+$', `${'a'.repeat(40)}!`);
    expect(result).toBeNull();
    // Guard against catastrophic backtracking blocking the thread.
    expect(Date.now() - start).toBeLessThan(1000);
  });

  it('returns null for non-string or empty patterns', () => {
    expect(safeRegexExec('', 'abc')).toBeNull();
    // @ts-expect-error deliberately passing a non-string pattern
    expect(safeRegexExec(undefined, 'abc')).toBeNull();
  });

  it('returns null for invalid regex syntax instead of throwing', () => {
    expect(safeRegexExec('(', 'abc')).toBeNull();
  });

  it('returns null for over-long patterns', () => {
    expect(safeRegexExec(`${'a'.repeat(1001)}`, 'aaa')).toBeNull();
  });
});
