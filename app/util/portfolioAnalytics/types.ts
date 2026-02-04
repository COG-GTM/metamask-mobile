import { Hex } from '@metamask/utils';

export type TimePeriod = '24h' | '7d' | '30d' | '1y';

export interface TokenHolding {
  address: string;
  chainId: Hex;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  balanceFiat: number;
  isNative: boolean;
  acquisitionCost?: number;
  currentPrice?: number;
}

export interface ProfitLossResult {
  unrealizedPL: number;
  unrealizedPLPercent: number;
  realizedPL: number;
  totalPL: number;
  totalPLPercent: number;
}

export interface TokenProfitLoss {
  address: string;
  chainId: Hex;
  symbol: string;
  acquisitionCost: number;
  currentValue: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
}

export interface AssetAllocation {
  address: string;
  chainId: Hex;
  symbol: string;
  name: string;
  balanceFiat: number;
  percentage: number;
}

export interface NetworkAllocation {
  chainId: Hex;
  networkName: string;
  balanceFiat: number;
  percentage: number;
  tokenCount: number;
}

export interface AllocationResult {
  tokenAllocations: AssetAllocation[];
  networkAllocations: NetworkAllocation[];
  totalPortfolioValue: number;
}

export interface ROIResult {
  period: TimePeriod;
  startValue: number;
  endValue: number;
  absoluteReturn: number;
  percentageReturn: number;
}

export interface PortfolioROI {
  roi24h: ROIResult;
  roi7d: ROIResult;
  roi30d: ROIResult;
  roi1y: ROIResult;
}

export interface MarketDataWithPriceChange {
  price?: number;
  pricePercentChange1d?: number;
  pricePercentChange7d?: number;
  pricePercentChange30d?: number;
  pricePercentChange1y?: number;
}

export interface TokenWithMarketData extends TokenHolding {
  marketData?: MarketDataWithPriceChange;
}

export interface RealizedTransaction {
  tokenAddress: string;
  chainId: Hex;
  type: 'sell' | 'swap';
  amount: number;
  acquisitionCost: number;
  saleValue: number;
  realizedPL: number;
  timestamp: number;
}
