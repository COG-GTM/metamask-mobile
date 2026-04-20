import generateOTP from './generateOTP.util';

describe('generateOTP', () => {
  it('returns an array of 3 numbers', () => {
    const otps = generateOTP();
    expect(otps).toHaveLength(3);
    otps.forEach((n) => expect(typeof n).toBe('number'));
  });

  it('returns values in range [100, 999]', () => {
    for (let i = 0; i < 20; i++) {
      const otps = generateOTP();
      otps.forEach((n) => {
        expect(n).toBeGreaterThanOrEqual(100);
        expect(n).toBeLessThanOrEqual(999);
      });
    }
  });

  it('produces three unique values', () => {
    for (let i = 0; i < 20; i++) {
      const otps = generateOTP();
      expect(new Set(otps).size).toBe(3);
    }
  });

  it('uses Math.random to generate values', () => {
    const randomSpy = jest.spyOn(Math, 'random');
    generateOTP();
    expect(randomSpy).toHaveBeenCalled();
    randomSpy.mockRestore();
  });
});
