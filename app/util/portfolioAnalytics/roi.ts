import {
  TimePeriod,
  ROIResult,
  PortfolioROI,
  TokenWithMarketData,
} from './types';

export function calculateROIForPeriod(
  currentValue: number,
  pricePercentChange: number | undefined,
  period: TimePeriod,
): ROIResult {
  if (pricePercentChange === undefined || currentValue === 0) {
    return {
      period,
      startValue: currentValue,
      endValue: currentValue,
      absoluteReturn: 0,
      percentageReturn: 0,
    };
  }

  const percentageDecimal = pricePercentChange / 100;
  const startValue = currentValue / (1 + percentageDecimal);
  const absoluteReturn = currentValue - startValue;

  return {
    period,
    startValue,
    endValue: currentValue,
    absoluteReturn,
    percentageReturn: pricePercentChange,
  };
}

export function calculateTokenROI(
  token: TokenWithMarketData,
  period: TimePeriod,
): ROIResult {
  const currentValue = token.balanceFiat;
  let pricePercentChange: number | undefined;

  switch (period) {
    case '24h':
      pricePercentChange = token.marketData?.pricePercentChange1d;
      break;
    case '7d':
      pricePercentChange = token.marketData?.pricePercentChange7d;
      break;
    case '30d':
      pricePercentChange = token.marketData?.pricePercentChange30d;
      break;
    case '1y':
      pricePercentChange = token.marketData?.pricePercentChange1y;
      break;
  }

  return calculateROIForPeriod(currentValue, pricePercentChange, period);
}

export function calculatePortfolioROIForPeriod(
  tokens: TokenWithMarketData[],
  period: TimePeriod,
): ROIResult {
  let totalCurrentValue = 0;
  let totalStartValue = 0;

  for (const token of tokens) {
    const tokenROI = calculateTokenROI(token, period);
    totalCurrentValue += tokenROI.endValue;
    totalStartValue += tokenROI.startValue;
  }

  const absoluteReturn = totalCurrentValue - totalStartValue;
  const percentageReturn =
    totalStartValue !== 0 ? (absoluteReturn / totalStartValue) * 100 : 0;

  return {
    period,
    startValue: totalStartValue,
    endValue: totalCurrentValue,
    absoluteReturn,
    percentageReturn,
  };
}

export function calculateAllPortfolioROI(
  tokens: TokenWithMarketData[],
): PortfolioROI {
  return {
    roi24h: calculatePortfolioROIForPeriod(tokens, '24h'),
    roi7d: calculatePortfolioROIForPeriod(tokens, '7d'),
    roi30d: calculatePortfolioROIForPeriod(tokens, '30d'),
    roi1y: calculatePortfolioROIForPeriod(tokens, '1y'),
  };
}

export function getROIByPeriod(
  portfolioROI: PortfolioROI,
  period: TimePeriod,
): ROIResult {
  switch (period) {
    case '24h':
      return portfolioROI.roi24h;
    case '7d':
      return portfolioROI.roi7d;
    case '30d':
      return portfolioROI.roi30d;
    case '1y':
      return portfolioROI.roi1y;
  }
}

export function formatROIValue(value: number, decimals: number = 2): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}`;
}

export function formatROIPercent(percent: number, decimals: number = 2): string {
  const sign = percent >= 0 ? '+' : '';
  return `${sign}${percent.toFixed(decimals)}%`;
}

export function isPositiveROI(roi: ROIResult): boolean {
  return roi.absoluteReturn >= 0;
}

export function compareROIPeriods(
  portfolioROI: PortfolioROI,
): { bestPeriod: TimePeriod; worstPeriod: TimePeriod } {
  const periods: TimePeriod[] = ['24h', '7d', '30d', '1y'];
  let bestPeriod: TimePeriod = '24h';
  let worstPeriod: TimePeriod = '24h';
  let bestReturn = portfolioROI.roi24h.percentageReturn;
  let worstReturn = portfolioROI.roi24h.percentageReturn;

  for (const period of periods) {
    const roi = getROIByPeriod(portfolioROI, period);
    if (roi.percentageReturn > bestReturn) {
      bestReturn = roi.percentageReturn;
      bestPeriod = period;
    }
    if (roi.percentageReturn < worstReturn) {
      worstReturn = roi.percentageReturn;
      worstPeriod = period;
    }
  }

  return { bestPeriod, worstPeriod };
}
