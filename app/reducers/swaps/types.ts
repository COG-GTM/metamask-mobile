export interface SwapsFeatureFlags {
  smartTransactions?: {
    mobileActive?: boolean;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface SwapsChainState {
  isLive: boolean;
  featureFlags?: SwapsFeatureFlags;
}

export interface SwapsState {
  isLive: boolean;
  hasOnboarded: boolean;
  featureFlags?: {
    smart_transactions?: unknown;
    smartTransactions?: {
      mobileActive?: boolean;
      [key: string]: unknown;
    };
  };
  [chainId: string]:
    | SwapsChainState
    | boolean
    | SwapsFeatureFlags
    | null
    | undefined;
}
