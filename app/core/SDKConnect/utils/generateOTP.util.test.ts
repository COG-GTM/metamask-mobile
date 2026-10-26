import generateOTP from './generateOTP.util';

describe('generateOTP', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns 3 unique numbers between 100 and 999', () => {
    const otps = generateOTP();
    expect(otps).toHaveLength(3);
    expect(new Set(otps).size).toBe(3);
    otps.forEach((otp) => {
      expect(otp).toBeGreaterThanOrEqual(100);
      expect(otp).toBeLessThanOrEqual(999);
    });
  });

  it('skips duplicates', () => {
    jest
      .spyOn(Math, 'random')
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.5)
      .mockReturnValueOnce(0.5)
      .mockReturnValueOnce(0.9999);
    expect(generateOTP()).toEqual([100, 550, 999]);
  });
});
