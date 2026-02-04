export interface AssetAllocation {
  key: string;
  name: string;
  symbol: string;
  value: number;
  percentage: number;
  color: string;
  networkName?: string;
}

export interface AssetAllocationChartProps {
  data: AssetAllocation[];
  isLoading?: boolean;
  totalValue?: string;
}
