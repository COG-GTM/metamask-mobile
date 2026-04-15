/**
 * Typed state interfaces for each Redux reducer slice.
 *
 * These interfaces mirror the `initialState` objects defined in the
 * corresponding JS reducer files under `app/reducers/`.  They are intended
 * to replace the `any` annotations in the root `RootState` interface and to
 * provide compile-time safety for selectors and `useSelector` hooks.
 */

import type { EngineState } from '../core/Engine/types';
import type {
  Bookmark,
  NotificationItem,
  SelectedAsset,
  TransactionData,
  SecurityAlertResponse,
} from '../actions/types';

// ---------------------------------------------------------------------------
// Alert
// ---------------------------------------------------------------------------
export interface AlertState {
  isVisible: boolean;
  autodismiss: number | null;
  content: string | null;
  data: unknown | null;
}

// ---------------------------------------------------------------------------
// Bookmarks
// ---------------------------------------------------------------------------
export type BookmarksState = Bookmark[];

// ---------------------------------------------------------------------------
// Browser
// ---------------------------------------------------------------------------
export interface BrowserTab {
  url: string;
  id: number;
  linkType?: string;
  image?: string;
  isArchived?: boolean;
}

export interface BrowserHistoryEntry {
  url: string;
  name: string;
}

export interface Favicon {
  origin: string;
  url: string;
}

export interface BrowserState {
  history: BrowserHistoryEntry[];
  whitelist: string[];
  tabs: BrowserTab[];
  favicons: Favicon[];
  activeTab: number | null;
  visitedDappsByHostname: Record<string, boolean>;
}

// ---------------------------------------------------------------------------
// Collectibles (NFT Favorites)
// ---------------------------------------------------------------------------
export interface CollectibleFavoriteEntry {
  tokenId: string;
  address: string;
}

export interface CollectiblesState {
  favorites: Record<string, Record<string, CollectibleFavoriteEntry[]>>;
  isNftFetchingProgress: boolean;
}

// ---------------------------------------------------------------------------
// Infura Availability
// ---------------------------------------------------------------------------
export interface InfuraAvailabilityState {
  isBlocked: boolean;
}

// ---------------------------------------------------------------------------
// Modals
// ---------------------------------------------------------------------------
export interface ModalsState {
  networkModalVisible: boolean;
  shouldNetworkSwitchPopToWallet: boolean;
  collectibleContractModalVisible: boolean;
  dappTransactionModalVisible: boolean;
  signMessageModalVisible: boolean;
  infoNetworkModalVisible?: boolean;
}

// ---------------------------------------------------------------------------
// Notification (in-app v1)
// ---------------------------------------------------------------------------
export interface NotificationState {
  notifications: NotificationItem[];
}

// ---------------------------------------------------------------------------
// Privacy
// ---------------------------------------------------------------------------
export interface PrivacyState {
  approvedHosts: Record<string, boolean>;
  revealSRPTimestamps: number[];
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------
export interface SettingsState {
  searchEngine: string;
  primaryCurrency: string;
  lockTime: number;
  useBlockieIcon: boolean;
  hideZeroBalanceTokens: boolean;
  basicFunctionalityEnabled: boolean;
  showHexData?: boolean;
  showCustomNonce?: boolean;
  showFiatOnTestnets?: boolean;
  deviceNotificationEnabled?: boolean;
  tokenSortConfig?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Swaps
// ---------------------------------------------------------------------------
export interface SwapsChainState {
  isLive: boolean;
  featureFlags: Record<string, unknown> | undefined;
}

export interface SwapsState {
  isLive: boolean;
  hasOnboarded: boolean;
  featureFlags: Record<string, unknown> | undefined;
  [chainId: string]: SwapsChainState | boolean | Record<string, unknown> | undefined;
}

// ---------------------------------------------------------------------------
// Transaction
// ---------------------------------------------------------------------------
export interface TransactionState {
  ensRecipient: string | undefined;
  assetType: string | undefined;
  selectedAsset: SelectedAsset;
  transaction: TransactionData;
  warningGasPriceHigh: string | undefined;
  transactionTo: string | undefined;
  transactionToName: string | undefined;
  transactionFromName: string | undefined;
  transactionValue: string | undefined;
  symbol: string | undefined;
  paymentRequest: unknown | undefined;
  readableValue: string | undefined;
  id: string | undefined;
  type: string | undefined;
  proposedNonce: string | undefined;
  nonce: string | undefined;
  securityAlertResponses: Record<string, SecurityAlertResponse>;
  useMax: boolean;
  maxValueMode?: boolean;
}

// ---------------------------------------------------------------------------
// Wizard
// ---------------------------------------------------------------------------
export interface WizardState {
  step: number;
}

// ---------------------------------------------------------------------------
// Re-export EngineState for convenience
// ---------------------------------------------------------------------------
export type { EngineState };
