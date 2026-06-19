import { getSecureRandomInt } from '../../../util/random';

/**
 * Generate random otp numbers.
 * The first number array[0] should be the actual otp answer.
 *
 * @returns {array} of the 3 number between 100 and 999
 */
const generateOTP = (): number[] => {
  const n1 = getSecureRandomInt(100, 999);
  const otps = [n1];
  while (otps.length < 3) {
    const n = getSecureRandomInt(100, 999);
    if (otps.indexOf(n) === -1) {
      otps.push(n);
    }
  }
  return otps;
};

export default generateOTP;
