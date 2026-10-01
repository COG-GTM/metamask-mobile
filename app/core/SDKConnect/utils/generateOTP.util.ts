import { getRandomBytes } from '../../Encryptor/bytes';

/**
 * Generate a uniformly distributed random integer in the inclusive range
 * [min, max] using a cryptographically secure source of randomness
 * (`getRandomBytes`, backed by `Crypto.getRandomValues`).
 *
 * Uses rejection sampling to avoid modulo bias: it draws just enough random
 * bytes to cover the range, rejects any draw that falls in the biased tail
 * (i.e. `>= floor(maxValue / range) * range`), and retries until it gets an
 * unbiased value.
 *
 * @param min - Inclusive lower bound.
 * @param max - Inclusive upper bound.
 * @returns A uniformly random integer in [min, max].
 */
const generateRandomIntegerInRange = (min: number, max: number): number => {
  const range = max - min + 1;
  // Number of random bytes needed to represent at least `range` distinct values.
  const bytesNeeded = Math.ceil(Math.log2(range) / 8);
  const maxValue = 2 ** (bytesNeeded * 8);
  // Largest multiple of `range` that fits in `maxValue`. Any draw at or above
  // this limit lands in the biased tail and must be rejected to keep the
  // distribution uniform.
  const limit = Math.floor(maxValue / range) * range;

  for (;;) {
    const bytes = getRandomBytes(bytesNeeded);
    let value = 0;
    for (let i = 0; i < bytesNeeded; i++) {
      value = value * 256 + bytes[i];
    }
    if (value < limit) {
      return min + (value % range);
    }
    // value is in the biased tail -> reject and draw again.
  }
};

/**
 * Generate random otp numbers.
 * The first number array[0] should be the actual otp answer.
 *
 * @returns {array} of the 3 number between 100 and 999
 */
const generateOTP = (): number[] => {
  const n1 = generateRandomIntegerInRange(100, 999);
  const otps = [n1];
  while (otps.length < 3) {
    const n = generateRandomIntegerInRange(100, 999);
    if (otps.indexOf(n) === -1) {
      otps.push(n);
    }
  }
  return otps;
};

export default generateOTP;
