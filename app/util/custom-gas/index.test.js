import {
  ETH,
  GWEI,
  WEI,
  apiEstimateModifiedToWEI,
  convertApiValueToGWEI,
  getWeiGasFee,
  getRenderableEthGasFee,
} from './index';

describe('custom-gas utils', () => {
  describe('constants', () => {
    it('exports ETH constant', () => {
      expect(ETH).toBe('ETH');
    });

    it('exports GWEI constant', () => {
      expect(GWEI).toBe('GWEI');
    });

    it('exports WEI constant', () => {
      expect(WEI).toBe('WEI');
    });
  });

  describe('convertApiValueToGWEI', () => {
    it('converts string number to integer string', () => {
      expect(convertApiValueToGWEI('20')).toBe('20');
    });

    it('truncates decimal values', () => {
      expect(convertApiValueToGWEI('20.5')).toBe('20');
    });

    it('handles integer input', () => {
      expect(convertApiValueToGWEI(30)).toBe('30');
    });
  });

  describe('apiEstimateModifiedToWEI', () => {
    it('returns a BN object', () => {
      const result = apiEstimateModifiedToWEI(20);
      expect(result).toBeDefined();
      expect(result.toString()).toBeDefined();
    });
  });

  describe('getWeiGasFee', () => {
    it('returns a BN object', () => {
      const result = getWeiGasFee(20, 21000);
      expect(result).toBeDefined();
      expect(result.toString()).toBeDefined();
    });

    it('uses default gas limit of 21000', () => {
      const result = getWeiGasFee(20);
      expect(result).toBeDefined();
    });
  });

  describe('getRenderableEthGasFee', () => {
    it('returns a string', () => {
      const result = getRenderableEthGasFee(20, 21000);
      expect(typeof result).toBe('string');
    });
  });
});
