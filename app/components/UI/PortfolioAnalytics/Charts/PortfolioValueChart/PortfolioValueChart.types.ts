export type TimePeriod = '1d' | '7d' | '1m' | '3m' | '1y';

export interface PortfolioDataPoint {
  timestamp: number;
  value: number;
}

export interface PortfolioValueChartProps {
  data: PortfolioDataPoint[];
  isLoading?: boolean;
  onTimePeriodChange?: (period: TimePeriod) => void;
  selectedTimePeriod?: TimePeriod;
  currentValue?: string;
  valueChange?: number;
  valueChangePercentage?: number;
}
