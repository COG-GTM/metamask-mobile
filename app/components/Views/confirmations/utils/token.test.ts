import { getTokenDetails } from '../../../../util/address';
import {
  ERC20_DEFAULT_DECIMALS,
  fetchErc20Decimals,
  memoizedGetTokenStandardAndDetails,
  parseTokenDetailDecimals,
} from './token';

jest.mock('../../../../util/address', () => ({
  getTokenDetails: jest.fn(),
}));

const mockGetTokenDetails = getTokenDetails as jest.MockedFunction<
  typeof getTokenDetails
>;

describe('confirmations token utils', () => {
  describe('ERC20_DEFAULT_DECIMALS', () => {
    it('defaults to the ERC20 standard of 18 decimals', () => {
      expect(ERC20_DEFAULT_DECIMALS).toBe(18);
    });
  });

  describe('parseTokenDetailDecimals', () => {
    it('returns undefined for empty / missing input', () => {
      expect(parseTokenDetailDecimals()).toBeUndefined();
      expect(parseTokenDetailDecimals(undefined)).toBeUndefined();
      expect(parseTokenDetailDecimals('')).toBeUndefined();
    });

    it('parses a decimal string', () => {
      expect(parseTokenDetailDecimals('6')).toBe(6);
      expect(parseTokenDetailDecimals('18')).toBe(18);
    });

    it('falls back to hex parsing when the value is not pure decimal', () => {
      // 'ff' is NaN in radix 10 but 255 in radix 16.
      expect(parseTokenDetailDecimals('ff')).toBe(255);
    });

    it('returns undefined for strings that are neither valid decimal nor hex', () => {
      expect(parseTokenDetailDecimals('nope')).toBeUndefined();
    });
  });

  describe('memoizedGetTokenStandardAndDetails', () => {
    beforeEach(() => {
      memoizedGetTokenStandardAndDetails.cache.clear?.();
      mockGetTokenDetails.mockReset();
    });

    it('returns an empty object when no token address is provided', async () => {
      const result = await memoizedGetTokenStandardAndDetails({});
      expect(result).toStrictEqual({});
    });

    it('returns token details from getTokenDetails', async () => {
      const tokenDetails = { standard: 'ERC20', decimals: '6' };
      mockGetTokenDetails.mockResolvedValue(tokenDetails as never);

      const result = await memoizedGetTokenStandardAndDetails({
        tokenAddress: '0x1',
      });
      expect(result).toStrictEqual(tokenDetails);
    });

    it('returns an empty object when the underlying fetch throws', async () => {
      mockGetTokenDetails.mockRejectedValue(new Error('boom'));

      const result = await memoizedGetTokenStandardAndDetails({
        tokenAddress: '0x2',
      });
      expect(result).toStrictEqual({});
    });
  });

  describe('fetchErc20Decimals', () => {
    beforeEach(() => {
      memoizedGetTokenStandardAndDetails.cache.clear?.();
      mockGetTokenDetails.mockReset();
    });

    it('returns the parsed decimals for an ERC20 token', async () => {
      mockGetTokenDetails.mockResolvedValue({
        decimals: '6',
        standard: 'ERC20',
      } as never);

      expect(await fetchErc20Decimals('0xabc')).toBe(6);
    });

    it('falls back to ERC20_DEFAULT_DECIMALS when decimals are missing', async () => {
      mockGetTokenDetails.mockResolvedValue({ standard: 'ERC20' } as never);

      expect(await fetchErc20Decimals('0xdef')).toBe(ERC20_DEFAULT_DECIMALS);
    });

    it('falls back to ERC20_DEFAULT_DECIMALS when the fetch throws', async () => {
      mockGetTokenDetails.mockRejectedValue(new Error('boom'));

      expect(await fetchErc20Decimals('0xbad')).toBe(ERC20_DEFAULT_DECIMALS);
    });
  });
});
