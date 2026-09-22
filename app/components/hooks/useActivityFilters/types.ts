export enum ActivityTypeCategory {
  Send = 'send',
  Receive = 'receive',
  Swap = 'swap',
  Bridge = 'bridge',
  Approve = 'approve',
  ContractInteraction = 'contractInteraction',
}

export enum ActivityStatusCategory {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Failed = 'failed',
}

export enum DateRangePreset {
  Last7Days = 'last7Days',
  Last30Days = 'last30Days',
  Last90Days = 'last90Days',
  ThisYear = 'thisYear',
  Custom = 'custom',
}

export interface ActivityDateRange {
  preset: DateRangePreset;
  /** Inclusive start of the range, epoch ms. Only used when preset is Custom. */
  startTime?: number;
  /** Inclusive end of the range, epoch ms. Only used when preset is Custom. */
  endTime?: number;
}

export interface ActivityFilterState {
  query: string;
  types: ActivityTypeCategory[];
  statuses: ActivityStatusCategory[];
  dateRange?: ActivityDateRange;
}

export const EMPTY_ACTIVITY_FILTER_STATE: ActivityFilterState = {
  query: '',
  types: [],
  statuses: [],
};

/**
 * Minimal shape of a transaction that the activity filters depend on. The
 * activity list holds `TransactionMeta` objects augmented at the app level
 * (`isTransfer`, `transferInformation`, `insertImportTime`), so this describes
 * only the fields the filters read.
 */
export interface FilterableTransaction {
  id: string;
  chainId?: string;
  hash?: string;
  status: string;
  time: number;
  type?: string;
  isTransfer?: boolean;
  transferInformation?: {
    contractAddress?: string;
    symbol?: string;
    decimals?: number;
  };
  txParams: {
    from?: string;
    to?: string;
    data?: string;
  };
}

export interface SearchIndexContext {
  selectedAddress: string;
  /** Token address (lowercase) to `${symbol} ${name}` for tokens held by the account. */
  tokenLabelsByAddress: Record<string, string>;
  /** Chain id to human readable network name. */
  networkNamesByChainId: Record<string, string>;
  /** Type category to its localised, user visible label. */
  typeLabels: Record<ActivityTypeCategory, string>;
}
