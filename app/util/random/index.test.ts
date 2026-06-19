import Crypto from 'react-native-quick-crypto';
import { getSecureRandomInt } from '.';

const mockedGetRandomValues = jest.mocked(Crypto.getRandomValues);

// The global jest mock for `getRandomValues` only fills 0-255, which never
// exercises the rejection-sampling branch or the upper end of a wide range.
// Queue explicit uint32 values so those paths are covered.
const queueRandomUint32 = (...values: number[]) => {
  for (const value of values) {
    mockedGetRandomValues.mockImplementationOnce((array) => {
      array[0] = value;
      return array;
    });
  }
};

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

  it('rejects draws at or above the bias threshold and resamples', () => {
    // range = 10 -> limit = 2^32 - (2^32 % 10) = 4294967290. The first draw is
    // at the threshold (rejected); the loop must resample the accepted value.
    mockedGetRandomValues.mockClear();
    queueRandomUint32(4294967290, 25);

    expect(getSecureRandomInt(0, 9)).toBe(5);
    expect(mockedGetRandomValues).toHaveBeenCalledTimes(2);
  });

  it('maps a high draw to the top of a wide range without bias', () => {
    // 899 % 900 === 899, so a 100..999 range must be able to return its max.
    // The default 0-255 mock can only ever produce 100..355, so this guards
    // the upper boundary explicitly.
    queueRandomUint32(899);

    expect(getSecureRandomInt(100, 999)).toBe(999);
  });
});
