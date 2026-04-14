import generateOTP from './generateOTP.util';

describe('generateOTP', () => {
  it('should return an array of 3 numbers', () => {
    const otps = generateOTP();
    expect(otps).toHaveLength(3);
    otps.forEach((otp) => {
      expect(typeof otp).toBe('number');
    });
  });

  it('should return numbers between 100 and 999', () => {
    const otps = generateOTP();
    otps.forEach((otp) => {
      expect(otp).toBeGreaterThanOrEqual(100);
      expect(otp).toBeLessThanOrEqual(999);
    });
  });

  it('should return unique numbers', () => {
    const otps = generateOTP();
    const uniqueOtps = new Set(otps);
    expect(uniqueOtps.size).toBe(3);
  });
});
