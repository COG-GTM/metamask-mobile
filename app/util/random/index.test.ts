import { getSecureRandomInt } from '.';

describe('getSecureRandomInt', () => {
  it('returns a value within the inclusive range', () => {
    for (let i = 0; i < 100; i++) {
      const value = getSecureRandomInt(100, 999);
      expect(value).toBeGreaterThanOrEqual(100);
      expect(value).toBeLessThanOrEqual(999);
      expect(Number.isInteger(value)).toBe(true);
    }
  });

  it('handles a single-value range', () => {
    expect(getSecureRandomInt(5, 5)).toBe(5);
  });

  it('supports a zero-based range as used by the SRP shuffle', () => {
    const value = getSecureRandomInt(0, 0);
    expect(value).toBe(0);
  });

  it('throws when arguments are invalid', () => {
    expect(() => getSecureRandomInt(10, 1)).toThrow();
    expect(() => getSecureRandomInt(1.5, 10)).toThrow();
  });

  it('throws when the range exceeds 2^32 instead of looping forever', () => {
    expect(() => getSecureRandomInt(0, 0x100000000)).toThrow();
  });
});
