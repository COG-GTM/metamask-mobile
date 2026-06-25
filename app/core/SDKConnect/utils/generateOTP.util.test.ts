import generateOTP from './generateOTP.util';
import { getRandomBytes } from '../../Encryptor/bytes';

jest.mock('../../Encryptor/bytes', () => ({
  getRandomBytes: jest.fn(),
}));

const mockGetRandomBytes = getRandomBytes as jest.MockedFunction<
  typeof getRandomBytes
>;

// generateRandomIntegerInRange(100, 999) uses range = 900, which requires
// 2 random bytes (maxValue = 65536). The bias rejection limit is therefore
// floor(65536 / 900) * 900 = 64800: any 16-bit draw >= 64800 must be rejected.
const RANGE = 900;
const MAX_VALUE = 65536;
const LIMIT = Math.floor(MAX_VALUE / RANGE) * RANGE; // 64800

/**
 * Turn a 16-bit integer value into the big-endian Uint8Array that the
 * implementation reconstructs it from.
 */
const toBytes = (value: number): Uint8Array =>
  new Uint8Array([(value >> 8) & 0xff, value & 0xff]);

/**
 * Configure the mocked CSPRNG to yield the provided 16-bit values, one per
 * call, in order.
 */
const queueValues = (values: number[]): void => {
  let call = 0;
  mockGetRandomBytes.mockImplementation(() => toBytes(values[call++]));
};

describe('generateOTP', () => {
  beforeEach(() => {
    mockGetRandomBytes.mockReset();
  });

  it('does not use Math.random()', () => {
    const mathRandomSpy = jest.spyOn(Math, 'random');
    // Three distinct in-range draws.
    queueValues([0, 1, 2]);

    generateOTP();

    expect(mathRandomSpy).not.toHaveBeenCalled();
    expect(mockGetRandomBytes).toHaveBeenCalled();
    mathRandomSpy.mockRestore();
  });

  it('returns 3 values, each within the [100, 999] range', () => {
    // Arbitrary distinct, in-range, non-tail draws.
    queueValues([10, 20, 30]);

    const otps = generateOTP();

    expect(otps).toHaveLength(3);
    otps.forEach((otp) => {
      expect(otp).toBeGreaterThanOrEqual(100);
      expect(otp).toBeLessThanOrEqual(999);
    });
  });

  it('returns 3 distinct values, retrying when a draw collides', () => {
    // value 0 -> 100, value 900 -> 100 (duplicate, rejected for distinctness),
    // value 1 -> 101, value 2 -> 102.
    queueValues([0, 900, 1, 2]);

    const otps = generateOTP();

    expect(otps).toEqual([100, 101, 102]);
    expect(new Set(otps).size).toBe(3);
    // 4 draws: one was a distinctness collision that triggered a retry.
    expect(mockGetRandomBytes).toHaveBeenCalledTimes(4);
  });

  it('rejects draws in the modulo-bias tail and re-draws', () => {
    // First draw lands exactly on the bias limit (64800) and MUST be rejected;
    // without rejection it would map to 100 + (64800 % 900) = 100 and the call
    // count / values below would differ.
    queueValues([LIMIT, 0, 901, 1800, 902]);

    const otps = generateOTP();

    // 64800 rejected (tail) -> 0 -> 100; 901 -> 101; 1800 -> 100 (distinctness
    // collision, rejected) -> 902 -> 102.
    expect(otps).toEqual([100, 101, 102]);
    // 5 draws total: 1 modulo-bias rejection + 1 distinctness rejection + 3 accepted.
    expect(mockGetRandomBytes).toHaveBeenCalledTimes(5);
  });

  it('keeps the answer (first element) within range after a tail rejection', () => {
    // A value just below the limit is accepted: 64799 % 900 = 899 -> 999.
    queueValues([64799, 0, 1]);

    const otps = generateOTP();

    expect(otps[0]).toBe(999);
    expect(otps[0]).toBeGreaterThanOrEqual(100);
    expect(otps[0]).toBeLessThanOrEqual(999);
  });
});
