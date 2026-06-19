import Crypto from 'react-native-quick-crypto';

const MAX_UINT32_PLUS_ONE = 0x100000000; // 2^32

/**
 * Generate a cryptographically secure random integer in the inclusive range
 * [min, max].
 *
 * Uses the platform CSPRNG (react-native-quick-crypto's `getRandomValues`) and
 * rejection sampling to avoid the modulo bias that a plain `value % range`
 * would introduce.
 *
 * @param min - Inclusive lower bound.
 * @param max - Inclusive upper bound.
 * @returns A uniformly distributed integer between min and max.
 */
export const getSecureRandomInt = (min: number, max: number): number => {
  if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) {
    throw new Error('getSecureRandomInt requires integers with max >= min');
  }

  const range = max - min + 1;
  // A single uint32 only carries enough entropy for ranges up to 2^32. Beyond
  // that `limit` would underflow to 0 and the rejection loop could never exit.
  if (range > MAX_UINT32_PLUS_ONE) {
    throw new Error('getSecureRandomInt range must not exceed 2^32');
  }

  // Largest multiple of `range` that fits in a uint32; values at or above this
  // threshold are rejected to keep the distribution uniform.
  const limit = MAX_UINT32_PLUS_ONE - (MAX_UINT32_PLUS_ONE % range);
  const buffer = new Uint32Array(1);

  let value: number;
  do {
    Crypto.getRandomValues(buffer);
    value = buffer[0];
  } while (value >= limit);

  return min + (value % range);
};
