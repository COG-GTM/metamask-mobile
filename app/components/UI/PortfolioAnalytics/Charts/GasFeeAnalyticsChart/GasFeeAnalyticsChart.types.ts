export type GasTimePeriod = '7d' | '1m' | '3m' | '1y';

export interface GasFeeDataPoint {
  label: string;
  value: number;
  timestamp: number;
}

export interface GasFeeAnalyticsChartProps {
  data: GasFeeDataPoint[];
  isLoading?: boolean;
  totalGasFees?: string;
  currency?: string;
  onTimePeriodChange?: (period: GasTimePeriod) => void;
  selectedTimePeriod?: GasTimePeriod;
}
