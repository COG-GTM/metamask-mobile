import { Hex } from '@metamask/utils';
import {
  calculateROIForPeriod,
  calculateTokenROI,
  calculatePortfolioROIForPeriod,
  calculateAllPortfolioROI,
  getROIByPeriod,
  formatROIValue,
  formatROIPercent,
  isPositiveROI,
  compareROIPeriods,
} from './roi';
import { TokenWithMarketData, PortfolioROI } from './types';

const createMockTokenWithMarketData = (
  overrides: Partial<TokenWithMarketData> = {},
): TokenWithMarketData => ({
  address: '0x1234567890abcdef1234567890abcdef12345678',
  chainId: '0x1' as Hex,
  symbol: 'TEST',
  name: 'Test Token',
  decimals: 18,
  balance: '100',
  balanceFiat: 1000,
  isNative: false,
  marketData: {
    price: 10,
    pricePercentChange1d: 5,
    pricePercentChange7d: 10,
    pricePercentChange30d: 20,
    pricePercentChange1y: 50,
  },
  ...overrides,
});

describe('roi', () => {
  describe('calculateROIForPeriod', () => {
    it('calculates ROI correctly with positive price change', () => {
      const result = calculateROIForPeriod(1050, 5, '24h');

      expect(result.period).toBe('24h');
      expect(result.endValue).toBe(1050);
      expect(result.startValue).toBe(1000);
      expect(result.absoluteReturn).toBe(50);
      expect(result.percentageReturn).toBe(5);
    });

    it('calculates ROI correctly with negative price change', () => {
      const result = calculateROIForPeriod(950, -5, '24h');

      expect(result.endValue).toBe(950);
      expect(result.startValue).toBe(1000);
      expect(result.absoluteReturn).toBe(-50);
      expect(result.percentageReturn).toBe(-5);
    });

    it('returns zero ROI when price change is undefined', () => {
      const result = calculateROIForPeriod(1000, undefined, '24h');

      expect(result.absoluteReturn).toBe(0);
      expect(result.percentageReturn).toBe(0);
      expect(result.startValue).toBe(1000);
      expect(result.endValue).toBe(1000);
    });

    it('returns zero ROI when current value is 0', () => {
      const result = calculateROIForPeriod(0, 10, '24h');

      expect(result.absoluteReturn).toBe(0);
      expect(result.percentageReturn).toBe(0);
    });
  });

  describe('calculateTokenROI', () => {
    it('calculates 24h ROI using pricePercentChange1d', () => {
      const token = createMockTokenWithMarketData({
        balanceFiat: 1050,
        marketData: { pricePercentChange1d: 5 },
      });

      const result = calculateTokenROI(token, '24h');

      expect(result.percentageReturn).toBe(5);
    });

    it('calculates 7d ROI using pricePercentChange7d', () => {
      const token = createMockTokenWithMarketData({
        balanceFiat: 1100,
        marketData: { pricePercentChange7d: 10 },
      });

      const result = calculateTokenROI(token, '7d');

      expect(result.percentageReturn).toBe(10);
    });

    it('calculates 30d ROI using pricePercentChange30d', () => {
      const token = createMockTokenWithMarketData({
        balanceFiat: 1200,
        marketData: { pricePercentChange30d: 20 },
      });

      const result = calculateTokenROI(token, '30d');

      expect(result.percentageReturn).toBe(20);
    });

    it('calculates 1y ROI using pricePercentChange1y', () => {
      const token = createMockTokenWithMarketData({
        balanceFiat: 1500,
        marketData: { pricePercentChange1y: 50 },
      });

      const result = calculateTokenROI(token, '1y');

      expect(result.percentageReturn).toBe(50);
    });

    it('handles missing market data', () => {
      const token = createMockTokenWithMarketData({
        balanceFiat: 1000,
        marketData: undefined,
      });

      const result = calculateTokenROI(token, '24h');

      expect(result.percentageReturn).toBe(0);
      expect(result.absoluteReturn).toBe(0);
    });
  });

  describe('calculatePortfolioROIForPeriod', () => {
    it('calculates weighted portfolio ROI for multiple tokens', () => {
      const tokens = [
        createMockTokenWithMarketData({
          balanceFiat: 1050,
          marketData: { pricePercentChange1d: 5 },
        }),
        createMockTokenWithMarketData({
          balanceFiat: 1100,
          marketData: { pricePercentChange1d: 10 },
        }),
      ];

      const result = calculatePortfolioROIForPeriod(tokens, '24h');

      expect(result.endValue).toBe(2150);
      expect(result.startValue).toBe(2000);
      expect(result.absoluteReturn).toBe(150);
      expect(result.percentageReturn).toBe(7.5);
    });

    it('returns zero ROI for empty token list', () => {
      const result = calculatePortfolioROIForPeriod([], '24h');

      expect(result.absoluteReturn).toBe(0);
      expect(result.percentageReturn).toBe(0);
    });
  });

  describe('calculateAllPortfolioROI', () => {
    it('calculates ROI for all time periods', () => {
      const tokens = [
        createMockTokenWithMarketData({
          balanceFiat: 1000,
          marketData: {
            pricePercentChange1d: 5,
            pricePercentChange7d: 10,
            pricePercentChange30d: 20,
            pricePercentChange1y: 50,
          },
        }),
      ];

      const result = calculateAllPortfolioROI(tokens);

      expect(result.roi24h.percentageReturn).toBeCloseTo(5, 5);
      expect(result.roi7d.percentageReturn).toBeCloseTo(10, 5);
      expect(result.roi30d.percentageReturn).toBeCloseTo(20, 5);
      expect(result.roi1y.percentageReturn).toBeCloseTo(50, 5);
    });
  });

  describe('getROIByPeriod', () => {
    it('returns correct ROI for each period', () => {
      const portfolioROI: PortfolioROI = {
        roi24h: {
          period: '24h',
          startValue: 1000,
          endValue: 1050,
          absoluteReturn: 50,
          percentageReturn: 5,
        },
        roi7d: {
          period: '7d',
          startValue: 1000,
          endValue: 1100,
          absoluteReturn: 100,
          percentageReturn: 10,
        },
        roi30d: {
          period: '30d',
          startValue: 1000,
          endValue: 1200,
          absoluteReturn: 200,
          percentageReturn: 20,
        },
        roi1y: {
          period: '1y',
          startValue: 1000,
          endValue: 1500,
          absoluteReturn: 500,
          percentageReturn: 50,
        },
      };

      expect(getROIByPeriod(portfolioROI, '24h').percentageReturn).toBe(5);
      expect(getROIByPeriod(portfolioROI, '7d').percentageReturn).toBe(10);
      expect(getROIByPeriod(portfolioROI, '30d').percentageReturn).toBe(20);
      expect(getROIByPeriod(portfolioROI, '1y').percentageReturn).toBe(50);
    });
  });

  describe('formatROIValue', () => {
    it('formats positive values with plus sign', () => {
      expect(formatROIValue(100)).toBe('+100.00');
      expect(formatROIValue(50.5)).toBe('+50.50');
    });

    it('formats negative values with minus sign', () => {
      expect(formatROIValue(-100)).toBe('-100.00');
    });

    it('formats zero with plus sign', () => {
      expect(formatROIValue(0)).toBe('+0.00');
    });

    it('respects decimal parameter', () => {
      expect(formatROIValue(100.123, 3)).toBe('+100.123');
    });
  });

  describe('formatROIPercent', () => {
    it('formats positive percentages with plus sign', () => {
      expect(formatROIPercent(20)).toBe('+20.00%');
    });

    it('formats negative percentages with minus sign', () => {
      expect(formatROIPercent(-15)).toBe('-15.00%');
    });

    it('respects decimal parameter', () => {
      expect(formatROIPercent(20.5, 1)).toBe('+20.5%');
    });
  });

  describe('isPositiveROI', () => {
    it('returns true for positive ROI', () => {
      const roi = {
        period: '24h' as const,
        startValue: 1000,
        endValue: 1100,
        absoluteReturn: 100,
        percentageReturn: 10,
      };

      expect(isPositiveROI(roi)).toBe(true);
    });

    it('returns true for zero ROI', () => {
      const roi = {
        period: '24h' as const,
        startValue: 1000,
        endValue: 1000,
        absoluteReturn: 0,
        percentageReturn: 0,
      };

      expect(isPositiveROI(roi)).toBe(true);
    });

    it('returns false for negative ROI', () => {
      const roi = {
        period: '24h' as const,
        startValue: 1000,
        endValue: 900,
        absoluteReturn: -100,
        percentageReturn: -10,
      };

      expect(isPositiveROI(roi)).toBe(false);
    });
  });

  describe('compareROIPeriods', () => {
    it('identifies best and worst performing periods', () => {
      const portfolioROI: PortfolioROI = {
        roi24h: {
          period: '24h',
          startValue: 1000,
          endValue: 950,
          absoluteReturn: -50,
          percentageReturn: -5,
        },
        roi7d: {
          period: '7d',
          startValue: 1000,
          endValue: 1100,
          absoluteReturn: 100,
          percentageReturn: 10,
        },
        roi30d: {
          period: '30d',
          startValue: 1000,
          endValue: 1200,
          absoluteReturn: 200,
          percentageReturn: 20,
        },
        roi1y: {
          period: '1y',
          startValue: 1000,
          endValue: 1500,
          absoluteReturn: 500,
          percentageReturn: 50,
        },
      };

      const { bestPeriod, worstPeriod } = compareROIPeriods(portfolioROI);

      expect(bestPeriod).toBe('1y');
      expect(worstPeriod).toBe('24h');
    });
  });
});
