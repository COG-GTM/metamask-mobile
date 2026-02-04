import { Hex } from '@metamask/utils';
import {
  calculateTotalPortfolioValue,
  calculateTokenAllocation,
  calculateAllTokenAllocations,
  calculateNetworkAllocation,
  calculateFullAllocation,
  getTopTokensByAllocation,
  getTopNetworksByAllocation,
  groupSmallAllocations,
  formatAllocationPercent,
} from './assetAllocation';
import { TokenHolding } from './types';

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

describe('assetAllocation', () => {
  describe('calculateTotalPortfolioValue', () => {
    it('sums all token fiat balances', () => {
      const tokens = [
        createMockToken({ balanceFiat: 1000 }),
        createMockToken({ balanceFiat: 500 }),
        createMockToken({ balanceFiat: 250 }),
      ];

      const result = calculateTotalPortfolioValue(tokens);

      expect(result).toBe(1750);
    });

    it('returns 0 for empty token list', () => {
      const result = calculateTotalPortfolioValue([]);
      expect(result).toBe(0);
    });
  });

  describe('calculateTokenAllocation', () => {
    it('calculates correct percentage allocation', () => {
      const token = createMockToken({ balanceFiat: 250 });
      const totalValue = 1000;

      const result = calculateTokenAllocation(token, totalValue);

      expect(result.percentage).toBe(25);
      expect(result.balanceFiat).toBe(250);
      expect(result.symbol).toBe('TEST');
    });

    it('returns 0 percentage when total value is 0', () => {
      const token = createMockToken({ balanceFiat: 100 });

      const result = calculateTokenAllocation(token, 0);

      expect(result.percentage).toBe(0);
    });
  });

  describe('calculateAllTokenAllocations', () => {
    it('calculates allocations for all tokens sorted by percentage', () => {
      const tokens = [
        createMockToken({ symbol: 'SMALL', balanceFiat: 100 }),
        createMockToken({ symbol: 'LARGE', balanceFiat: 900 }),
      ];

      const results = calculateAllTokenAllocations(tokens);

      expect(results).toHaveLength(2);
      expect(results[0].symbol).toBe('LARGE');
      expect(results[0].percentage).toBe(90);
      expect(results[1].symbol).toBe('SMALL');
      expect(results[1].percentage).toBe(10);
    });

    it('returns empty array for empty token list', () => {
      const results = calculateAllTokenAllocations([]);
      expect(results).toHaveLength(0);
    });
  });

  describe('calculateNetworkAllocation', () => {
    it('aggregates tokens by network', () => {
      const tokens = [
        createMockToken({ chainId: '0x1' as Hex, balanceFiat: 500 }),
        createMockToken({ chainId: '0x1' as Hex, balanceFiat: 300 }),
        createMockToken({ chainId: '0x89' as Hex, balanceFiat: 200 }),
      ];

      const networkConfigs = {
        '0x1': { name: 'Ethereum' },
        '0x89': { name: 'Polygon' },
      } as Record<Hex, { name: string }>;

      const results = calculateNetworkAllocation(tokens, networkConfigs);

      expect(results).toHaveLength(2);
      expect(results[0].chainId).toBe('0x1');
      expect(results[0].balanceFiat).toBe(800);
      expect(results[0].percentage).toBe(80);
      expect(results[0].tokenCount).toBe(2);
      expect(results[1].chainId).toBe('0x89');
      expect(results[1].balanceFiat).toBe(200);
      expect(results[1].percentage).toBe(20);
      expect(results[1].tokenCount).toBe(1);
    });

    it('uses fallback name for unknown networks', () => {
      const tokens = [createMockToken({ chainId: '0x999' as Hex })];
      const networkConfigs = {} as Record<Hex, { name: string }>;

      const results = calculateNetworkAllocation(tokens, networkConfigs);

      expect(results[0].networkName).toBe('Chain 0x999');
    });
  });

  describe('calculateFullAllocation', () => {
    it('returns complete allocation result', () => {
      const tokens = [
        createMockToken({ chainId: '0x1' as Hex, balanceFiat: 800 }),
        createMockToken({ chainId: '0x89' as Hex, balanceFiat: 200 }),
      ];

      const networkConfigs = {
        '0x1': { name: 'Ethereum' },
        '0x89': { name: 'Polygon' },
      } as Record<Hex, { name: string }>;

      const result = calculateFullAllocation(tokens, networkConfigs);

      expect(result.totalPortfolioValue).toBe(1000);
      expect(result.tokenAllocations).toHaveLength(2);
      expect(result.networkAllocations).toHaveLength(2);
    });
  });

  describe('getTopTokensByAllocation', () => {
    it('returns top N tokens by allocation', () => {
      const tokens = [
        createMockToken({ symbol: 'A', balanceFiat: 500 }),
        createMockToken({ symbol: 'B', balanceFiat: 300 }),
        createMockToken({ symbol: 'C', balanceFiat: 200 }),
      ];

      const allocations = calculateAllTokenAllocations(tokens);
      const top2 = getTopTokensByAllocation(allocations, 2);

      expect(top2).toHaveLength(2);
      expect(top2[0].symbol).toBe('A');
      expect(top2[1].symbol).toBe('B');
    });

    it('returns all if count exceeds length', () => {
      const tokens = [createMockToken({ symbol: 'A', balanceFiat: 500 })];

      const allocations = calculateAllTokenAllocations(tokens);
      const top5 = getTopTokensByAllocation(allocations, 5);

      expect(top5).toHaveLength(1);
    });
  });

  describe('getTopNetworksByAllocation', () => {
    it('returns top N networks by allocation', () => {
      const tokens = [
        createMockToken({ chainId: '0x1' as Hex, balanceFiat: 500 }),
        createMockToken({ chainId: '0x89' as Hex, balanceFiat: 300 }),
        createMockToken({ chainId: '0xa' as Hex, balanceFiat: 200 }),
      ];

      const networkConfigs = {
        '0x1': { name: 'Ethereum' },
        '0x89': { name: 'Polygon' },
        '0xa': { name: 'Optimism' },
      } as Record<Hex, { name: string }>;

      const allocations = calculateNetworkAllocation(tokens, networkConfigs);
      const top2 = getTopNetworksByAllocation(allocations, 2);

      expect(top2).toHaveLength(2);
      expect(top2[0].networkName).toBe('Ethereum');
      expect(top2[1].networkName).toBe('Polygon');
    });
  });

  describe('groupSmallAllocations', () => {
    it('groups allocations below threshold into Other', () => {
      const tokens = [
        createMockToken({ symbol: 'LARGE', balanceFiat: 950 }),
        createMockToken({ symbol: 'TINY1', balanceFiat: 3 }),
        createMockToken({ symbol: 'TINY2', balanceFiat: 2 }),
      ];

      const allocations = calculateAllTokenAllocations(tokens);
      const { mainAllocations, otherAllocation } = groupSmallAllocations(
        allocations,
        1,
      );

      expect(mainAllocations).toHaveLength(1);
      expect(mainAllocations[0].symbol).toBe('LARGE');
      expect(otherAllocation).not.toBeNull();
      expect(otherAllocation?.balanceFiat).toBeCloseTo(5, 1);
    });

    it('returns null for other when no small allocations', () => {
      const tokens = [
        createMockToken({ symbol: 'A', balanceFiat: 500 }),
        createMockToken({ symbol: 'B', balanceFiat: 500 }),
      ];

      const allocations = calculateAllTokenAllocations(tokens);
      const { mainAllocations, otherAllocation } = groupSmallAllocations(
        allocations,
        1,
      );

      expect(mainAllocations).toHaveLength(2);
      expect(otherAllocation).toBeNull();
    });
  });

  describe('formatAllocationPercent', () => {
    it('formats percentage with default decimals', () => {
      expect(formatAllocationPercent(25)).toBe('25.00%');
      expect(formatAllocationPercent(33.333)).toBe('33.33%');
    });

    it('respects decimal parameter', () => {
      expect(formatAllocationPercent(25.5, 1)).toBe('25.5%');
      expect(formatAllocationPercent(25.555, 3)).toBe('25.555%');
    });
  });
});
