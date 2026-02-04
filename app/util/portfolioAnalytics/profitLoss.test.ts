import { Hex } from '@metamask/utils';
import {
  calculateTokenUnrealizedPL,
  calculatePortfolioUnrealizedPL,
  calculateRealizedPL,
  calculateTotalProfitLoss,
  aggregatePLByToken,
  formatPLValue,
  formatPLPercent,
} from './profitLoss';
import { TokenHolding, RealizedTransaction, TokenProfitLoss } from './types';

const createMockToken = (
  overrides: Partial<TokenHolding> = {},
): TokenHolding => ({
  address: '0x1234567890abcdef1234567890abcdef12345678',
  chainId: '0x1' as Hex,
  symbol: 'TEST',
  name: 'Test Token',
  decimals: 18,
  balance: '100',
  balanceFiat: 1000,
  isNative: false,
  ...overrides,
});

describe('profitLoss', () => {
  describe('calculateTokenUnrealizedPL', () => {
    it('calculates unrealized P&L when acquisition cost is provided', () => {
      const token = createMockToken({
        balanceFiat: 1200,
        acquisitionCost: 1000,
      });

      const result = calculateTokenUnrealizedPL(token);

      expect(result.unrealizedPL).toBe(200);
      expect(result.unrealizedPLPercent).toBe(20);
      expect(result.currentValue).toBe(1200);
      expect(result.acquisitionCost).toBe(1000);
    });

    it('uses current value as acquisition cost when not provided', () => {
      const token = createMockToken({
        balanceFiat: 1000,
      });

      const result = calculateTokenUnrealizedPL(token);

      expect(result.unrealizedPL).toBe(0);
      expect(result.unrealizedPLPercent).toBe(0);
      expect(result.acquisitionCost).toBe(1000);
    });

    it('handles negative P&L correctly', () => {
      const token = createMockToken({
        balanceFiat: 800,
        acquisitionCost: 1000,
      });

      const result = calculateTokenUnrealizedPL(token);

      expect(result.unrealizedPL).toBe(-200);
      expect(result.unrealizedPLPercent).toBe(-20);
    });

    it('handles zero acquisition cost', () => {
      const token = createMockToken({
        balanceFiat: 100,
        acquisitionCost: 0,
      });

      const result = calculateTokenUnrealizedPL(token);

      expect(result.unrealizedPL).toBe(100);
      expect(result.unrealizedPLPercent).toBe(0);
    });
  });

  describe('calculatePortfolioUnrealizedPL', () => {
    it('calculates P&L for multiple tokens', () => {
      const tokens = [
        createMockToken({ balanceFiat: 1200, acquisitionCost: 1000 }),
        createMockToken({
          address: '0xabcd',
          balanceFiat: 500,
          acquisitionCost: 600,
        }),
      ];

      const results = calculatePortfolioUnrealizedPL(tokens);

      expect(results).toHaveLength(2);
      expect(results[0].unrealizedPL).toBe(200);
      expect(results[1].unrealizedPL).toBe(-100);
    });

    it('returns empty array for empty token list', () => {
      const results = calculatePortfolioUnrealizedPL([]);
      expect(results).toHaveLength(0);
    });
  });

  describe('calculateRealizedPL', () => {
    it('sums realized P&L from transactions', () => {
      const transactions: RealizedTransaction[] = [
        {
          tokenAddress: '0x1234',
          chainId: '0x1' as Hex,
          type: 'sell',
          amount: 10,
          acquisitionCost: 100,
          saleValue: 150,
          realizedPL: 50,
          timestamp: Date.now(),
        },
        {
          tokenAddress: '0x5678',
          chainId: '0x1' as Hex,
          type: 'swap',
          amount: 5,
          acquisitionCost: 50,
          saleValue: 40,
          realizedPL: -10,
          timestamp: Date.now(),
        },
      ];

      const result = calculateRealizedPL(transactions);

      expect(result).toBe(40);
    });

    it('returns 0 for empty transactions', () => {
      const result = calculateRealizedPL([]);
      expect(result).toBe(0);
    });
  });

  describe('calculateTotalProfitLoss', () => {
    it('calculates total P&L including unrealized and realized', () => {
      const tokens = [
        createMockToken({ balanceFiat: 1200, acquisitionCost: 1000 }),
        createMockToken({
          address: '0xabcd',
          balanceFiat: 500,
          acquisitionCost: 400,
        }),
      ];

      const transactions: RealizedTransaction[] = [
        {
          tokenAddress: '0x1234',
          chainId: '0x1' as Hex,
          type: 'sell',
          amount: 10,
          acquisitionCost: 100,
          saleValue: 150,
          realizedPL: 50,
          timestamp: Date.now(),
        },
      ];

      const result = calculateTotalProfitLoss(tokens, transactions);

      expect(result.unrealizedPL).toBe(300);
      expect(result.realizedPL).toBe(50);
      expect(result.totalPL).toBe(350);
    });

    it('calculates P&L without realized transactions', () => {
      const tokens = [
        createMockToken({ balanceFiat: 1200, acquisitionCost: 1000 }),
      ];

      const result = calculateTotalProfitLoss(tokens);

      expect(result.unrealizedPL).toBe(200);
      expect(result.realizedPL).toBe(0);
      expect(result.totalPL).toBe(200);
    });
  });

  describe('aggregatePLByToken', () => {
    it('aggregates P&L for same token across entries', () => {
      const tokenPLs: TokenProfitLoss[] = [
        {
          address: '0x1234',
          chainId: '0x1' as Hex,
          symbol: 'TEST',
          acquisitionCost: 100,
          currentValue: 120,
          unrealizedPL: 20,
          unrealizedPLPercent: 20,
        },
        {
          address: '0x1234',
          chainId: '0x1' as Hex,
          symbol: 'TEST',
          acquisitionCost: 50,
          currentValue: 60,
          unrealizedPL: 10,
          unrealizedPLPercent: 20,
        },
      ];

      const result = aggregatePLByToken(tokenPLs);

      expect(result.size).toBe(1);
      const aggregated = result.get('0x1-0x1234');
      expect(aggregated?.acquisitionCost).toBe(150);
      expect(aggregated?.currentValue).toBe(180);
      expect(aggregated?.unrealizedPL).toBe(30);
    });

    it('keeps different tokens separate', () => {
      const tokenPLs: TokenProfitLoss[] = [
        {
          address: '0x1234',
          chainId: '0x1' as Hex,
          symbol: 'TEST1',
          acquisitionCost: 100,
          currentValue: 120,
          unrealizedPL: 20,
          unrealizedPLPercent: 20,
        },
        {
          address: '0x5678',
          chainId: '0x1' as Hex,
          symbol: 'TEST2',
          acquisitionCost: 50,
          currentValue: 60,
          unrealizedPL: 10,
          unrealizedPLPercent: 20,
        },
      ];

      const result = aggregatePLByToken(tokenPLs);

      expect(result.size).toBe(2);
    });
  });

  describe('formatPLValue', () => {
    it('formats positive values with plus sign', () => {
      expect(formatPLValue(100)).toBe('+100.00');
      expect(formatPLValue(50.5)).toBe('+50.50');
    });

    it('formats negative values with minus sign', () => {
      expect(formatPLValue(-100)).toBe('-100.00');
      expect(formatPLValue(-50.5)).toBe('-50.50');
    });

    it('formats zero with plus sign', () => {
      expect(formatPLValue(0)).toBe('+0.00');
    });

    it('respects decimal parameter', () => {
      expect(formatPLValue(100.123, 3)).toBe('+100.123');
    });
  });

  describe('formatPLPercent', () => {
    it('formats positive percentages with plus sign', () => {
      expect(formatPLPercent(20)).toBe('+20.00%');
    });

    it('formats negative percentages with minus sign', () => {
      expect(formatPLPercent(-15)).toBe('-15.00%');
    });

    it('respects decimal parameter', () => {
      expect(formatPLPercent(20.5, 1)).toBe('+20.5%');
    });
  });
});
