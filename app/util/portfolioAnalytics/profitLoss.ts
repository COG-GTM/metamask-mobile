import {
  TokenHolding,
  TokenProfitLoss,
  ProfitLossResult,
  RealizedTransaction,
} from './types';

export function calculateTokenUnrealizedPL(
  token: TokenHolding,
): TokenProfitLoss {
  const currentValue = token.balanceFiat;
  const acquisitionCost = token.acquisitionCost ?? currentValue;

  const unrealizedPL = currentValue - acquisitionCost;
  const unrealizedPLPercent =
    acquisitionCost !== 0 ? (unrealizedPL / acquisitionCost) * 100 : 0;

  return {
    address: token.address,
    chainId: token.chainId,
    symbol: token.symbol,
    acquisitionCost,
    currentValue,
    unrealizedPL,
    unrealizedPLPercent,
  };
}

export function calculatePortfolioUnrealizedPL(
  tokens: TokenHolding[],
): TokenProfitLoss[] {
  return tokens.map((token) => calculateTokenUnrealizedPL(token));
}

export function calculateRealizedPL(
  transactions: RealizedTransaction[],
): number {
  return transactions.reduce((total, tx) => total + tx.realizedPL, 0);
}

export function calculateTotalProfitLoss(
  tokens: TokenHolding[],
  realizedTransactions: RealizedTransaction[] = [],
): ProfitLossResult {
  const tokenPLs = calculatePortfolioUnrealizedPL(tokens);

  const totalCurrentValue = tokenPLs.reduce(
    (sum, pl) => sum + pl.currentValue,
    0,
  );
  const totalAcquisitionCost = tokenPLs.reduce(
    (sum, pl) => sum + pl.acquisitionCost,
    0,
  );

  const unrealizedPL = totalCurrentValue - totalAcquisitionCost;
  const unrealizedPLPercent =
    totalAcquisitionCost !== 0
      ? (unrealizedPL / totalAcquisitionCost) * 100
      : 0;

  const realizedPL = calculateRealizedPL(realizedTransactions);

  const totalPL = unrealizedPL + realizedPL;
  const totalCostBasis = totalAcquisitionCost + Math.abs(realizedPL);
  const totalPLPercent =
    totalCostBasis !== 0 ? (totalPL / totalCostBasis) * 100 : 0;

  return {
    unrealizedPL,
    unrealizedPLPercent,
    realizedPL,
    totalPL,
    totalPLPercent,
  };
}

export function aggregatePLByToken(
  tokenPLs: TokenProfitLoss[],
): Map<string, TokenProfitLoss> {
  const aggregated = new Map<string, TokenProfitLoss>();

  for (const pl of tokenPLs) {
    const key = `${pl.chainId}-${pl.address.toLowerCase()}`;
    const existing = aggregated.get(key);

    if (existing) {
      const combinedAcquisitionCost =
        existing.acquisitionCost + pl.acquisitionCost;
      const combinedCurrentValue = existing.currentValue + pl.currentValue;
      const combinedUnrealizedPL = combinedCurrentValue - combinedAcquisitionCost;
      const combinedUnrealizedPLPercent =
        combinedAcquisitionCost !== 0
          ? (combinedUnrealizedPL / combinedAcquisitionCost) * 100
          : 0;

      aggregated.set(key, {
        ...existing,
        acquisitionCost: combinedAcquisitionCost,
        currentValue: combinedCurrentValue,
        unrealizedPL: combinedUnrealizedPL,
        unrealizedPLPercent: combinedUnrealizedPLPercent,
      });
    } else {
      aggregated.set(key, { ...pl });
    }
  }

  return aggregated;
}

export function formatPLValue(value: number, decimals: number = 2): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}`;
}

export function formatPLPercent(percent: number, decimals: number = 2): string {
  const sign = percent >= 0 ? '+' : '';
  return `${sign}${percent.toFixed(decimals)}%`;
}
