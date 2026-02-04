import { Hex } from '@metamask/utils';
import {
  TokenHolding,
  AssetAllocation,
  NetworkAllocation,
  AllocationResult,
} from './types';

export function calculateTotalPortfolioValue(tokens: TokenHolding[]): number {
  return tokens.reduce((total, token) => total + token.balanceFiat, 0);
}

export function calculateTokenAllocation(
  token: TokenHolding,
  totalPortfolioValue: number,
): AssetAllocation {
  const percentage =
    totalPortfolioValue > 0
      ? (token.balanceFiat / totalPortfolioValue) * 100
      : 0;

  return {
    address: token.address,
    chainId: token.chainId,
    symbol: token.symbol,
    name: token.name,
    balanceFiat: token.balanceFiat,
    percentage,
  };
}

export function calculateAllTokenAllocations(
  tokens: TokenHolding[],
): AssetAllocation[] {
  const totalPortfolioValue = calculateTotalPortfolioValue(tokens);

  return tokens
    .map((token) => calculateTokenAllocation(token, totalPortfolioValue))
    .sort((a, b) => b.percentage - a.percentage);
}

export function calculateNetworkAllocation(
  tokens: TokenHolding[],
  networkConfigurations: Record<Hex, { name: string }>,
): NetworkAllocation[] {
  const totalPortfolioValue = calculateTotalPortfolioValue(tokens);

  const networkMap = new Map<
    Hex,
    { balanceFiat: number; tokenCount: number; networkName: string }
  >();

  for (const token of tokens) {
    const chainId = token.chainId;
    const existing = networkMap.get(chainId);
    const networkName = networkConfigurations[chainId]?.name ?? `Chain ${chainId}`;

    if (existing) {
      networkMap.set(chainId, {
        balanceFiat: existing.balanceFiat + token.balanceFiat,
        tokenCount: existing.tokenCount + 1,
        networkName,
      });
    } else {
      networkMap.set(chainId, {
        balanceFiat: token.balanceFiat,
        tokenCount: 1,
        networkName,
      });
    }
  }

  const allocations: NetworkAllocation[] = [];

  networkMap.forEach((data, chainId) => {
    const percentage =
      totalPortfolioValue > 0
        ? (data.balanceFiat / totalPortfolioValue) * 100
        : 0;

    allocations.push({
      chainId,
      networkName: data.networkName,
      balanceFiat: data.balanceFiat,
      percentage,
      tokenCount: data.tokenCount,
    });
  });

  return allocations.sort((a, b) => b.percentage - a.percentage);
}

export function calculateFullAllocation(
  tokens: TokenHolding[],
  networkConfigurations: Record<Hex, { name: string }>,
): AllocationResult {
  const totalPortfolioValue = calculateTotalPortfolioValue(tokens);
  const tokenAllocations = calculateAllTokenAllocations(tokens);
  const networkAllocations = calculateNetworkAllocation(
    tokens,
    networkConfigurations,
  );

  return {
    tokenAllocations,
    networkAllocations,
    totalPortfolioValue,
  };
}

export function getTopTokensByAllocation(
  allocations: AssetAllocation[],
  count: number = 5,
): AssetAllocation[] {
  return allocations.slice(0, count);
}

export function getTopNetworksByAllocation(
  allocations: NetworkAllocation[],
  count: number = 5,
): NetworkAllocation[] {
  return allocations.slice(0, count);
}

export function groupSmallAllocations(
  allocations: AssetAllocation[],
  threshold: number = 1,
): { mainAllocations: AssetAllocation[]; otherAllocation: AssetAllocation | null } {
  const mainAllocations: AssetAllocation[] = [];
  let otherBalanceFiat = 0;
  let otherPercentage = 0;

  for (const allocation of allocations) {
    if (allocation.percentage >= threshold) {
      mainAllocations.push(allocation);
    } else {
      otherBalanceFiat += allocation.balanceFiat;
      otherPercentage += allocation.percentage;
    }
  }

  const otherAllocation: AssetAllocation | null =
    otherPercentage > 0
      ? {
          address: 'other',
          chainId: '0x0' as Hex,
          symbol: 'OTHER',
          name: 'Other Assets',
          balanceFiat: otherBalanceFiat,
          percentage: otherPercentage,
        }
      : null;

  return { mainAllocations, otherAllocation };
}

export function formatAllocationPercent(
  percentage: number,
  decimals: number = 2,
): string {
  return `${percentage.toFixed(decimals)}%`;
}
