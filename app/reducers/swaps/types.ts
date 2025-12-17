/**
 * Smart transactions feature flags
 */
export interface SmartTransactionsFeatureFlags {
  mobileActive?: boolean;
  mobileActiveIOS?: boolean;
  mobileActiveAndroid?: boolean;
  extensionActive?: boolean;
  [key: string]: unknown;
}

/**
 * Chain-specific feature flags
 */
export interface ChainFeatureFlags {
  smartTransactions?: SmartTransactionsFeatureFlags;
  [key: string]: unknown;
}

/**
 * Chain-specific swaps state
 */
export interface ChainSwapsState {
  isLive: boolean;
  featureFlags?: ChainFeatureFlags;
}

/**
 * Global feature flags
 */
export interface GlobalFeatureFlags {
  smart_transactions?: SmartTransactionsFeatureFlags;
  smartTransactions?: SmartTransactionsFeatureFlags;
}

/**
 * Swaps reducer state
 */
export interface SwapsState {
  isLive: boolean;
  hasOnboarded: boolean;
  featureFlags?: GlobalFeatureFlags;
  [chainId: string]:
    | ChainSwapsState
    | boolean
    | GlobalFeatureFlags
    | undefined
    | null;
}
