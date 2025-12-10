import { Hex } from '@metamask/utils';

/**
 * Legal Notices State
 */
export interface LegalNoticesState {
  newPrivacyPolicyToastClickedOrClosed: boolean;
  newPrivacyPolicyToastShownDate: number | null;
}

/**
 * Collectible (NFT) Favorite Item
 */
export interface CollectibleFavorite {
  tokenId: string;
  address: string;
}

/**
 * Collectibles State
 */
export interface CollectiblesState {
  favorites: Record<string, Record<string, CollectibleFavorite[]>>;
  isNftFetchingProgress: boolean;
}

/**
 * Privacy State
 */
export interface PrivacyState {
  approvedHosts: Record<string, boolean>;
  revealSRPTimestamps: number[];
}

/**
 * Bookmark Item
 */
export interface Bookmark {
  url: string;
  name: string;
}

/**
 * Bookmarks State - Array of bookmark items
 */
export type BookmarksState = Bookmark[];

/**
 * Browser History Item
 */
export interface BrowserHistoryItem {
  url: string;
  name: string;
}

/**
 * Browser Tab
 */
export interface BrowserTab {
  url: string;
  id: number;
  linkType?: string;
}

/**
 * Browser Favicon
 */
export interface BrowserFavicon {
  origin: string;
  url: string;
}

/**
 * Browser State
 */
export interface BrowserState {
  history: BrowserHistoryItem[];
  whitelist: string[];
  tabs: BrowserTab[];
  favicons: BrowserFavicon[];
  activeTab: number | null;
  visitedDappsByHostname: Record<string, boolean>;
}

/**
 * Modals State
 */
export interface ModalsState {
  networkModalVisible: boolean;
  shouldNetworkSwitchPopToWallet: boolean;
  collectibleContractModalVisible: boolean;
  dappTransactionModalVisible: boolean;
  signMessageModalVisible: boolean;
  infoNetworkModalVisible?: boolean;
}

/**
 * Settings State
 */
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
}

/**
 * Alert State
 */
export interface AlertState {
  isVisible: boolean;
  autodismiss: number | null;
  content: string | null;
  data: unknown | null;
}

/**
 * Transaction Data
 */
export interface TransactionData {
  data?: string;
  from?: string;
  gas?: string;
  gasPrice?: string;
  to?: string;
  value?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
}

/**
 * Selected Asset
 */
export interface SelectedAsset {
  tokenId?: string;
  isETH?: boolean;
  symbol?: string;
  address?: string;
  decimals?: number;
  image?: string;
  name?: string;
  standard?: string;
}

/**
 * Security Alert Response (flexible type for reducer state)
 */
export interface SecurityAlertResponseState {
  block?: number;
  chainId?: string;
  features?: (string | Record<string, string | undefined>)[];
  providerRequestsCount?: Record<string, number>;
  reason?: string;
  req?: Record<string, unknown>;
  result_type?: string;
  source?: string;
  description?: string;
  securityAlertId?: string;
}

/**
 * Transaction State
 */
export interface TransactionState {
  ensRecipient?: string;
  assetType?: string;
  selectedAsset: SelectedAsset;
  transaction: TransactionData;
  warningGasPriceHigh?: string;
  transactionTo?: string;
  transactionToName?: string;
  transactionFromName?: string;
  transactionValue?: string;
  symbol?: string;
  paymentRequest?: unknown;
  readableValue?: string;
  id?: string;
  type?: string;
  proposedNonce?: string;
  nonce?: string;
  securityAlertResponses: Record<string, SecurityAlertResponseState>;
  useMax?: boolean;
  maxValueMode?: boolean;
}

/**
 * Wizard State
 */
export interface WizardState {
  step: number;
}

/**
 * Notification Item
 */
export interface NotificationItem {
  id: string;
  isVisible: boolean;
  autodismiss?: number;
  title?: string;
  description?: string;
  status?: string;
  type: 'transaction' | 'simple';
  transaction?: {
    id: string;
    [key: string]: unknown;
  };
}

/**
 * Notification State
 */
export interface NotificationState {
  notifications: NotificationItem[];
}

/**
 * Swaps Chain State
 */
export interface SwapsChainState {
  isLive: boolean;
  featureFlags?: Record<string, unknown>;
}

/**
 * Swaps Feature Flags
 */
export interface SwapsFeatureFlags {
  smart_transactions?: Record<string, unknown>;
  smartTransactions?: Record<string, unknown>;
}

/**
 * Swaps State
 */
export interface SwapsState {
  isLive: boolean;
  hasOnboarded: boolean;
  featureFlags?: SwapsFeatureFlags;
  [chainId: Hex]: SwapsChainState;
}

/**
 * Infura Availability State
 */
export interface InfuraAvailabilityState {
  isBlocked: boolean;
}

/**
 * Network State for Network Onboarding
 */
export interface NetworkOnboardingNetworkState {
  showNetworkOnboarding: boolean;
  nativeToken: string;
  networkType: string;
  networkUrl: string;
}

/**
 * Switched Network State
 */
export interface SwitchedNetworkState {
  networkUrl: string;
  networkStatus: boolean;
}

/**
 * Network Onboarded State
 */
export interface NetworkOnboardedState {
  networkOnboardedState: Record<string, boolean>;
  networkState: NetworkOnboardingNetworkState;
  switchedNetwork: SwitchedNetworkState;
}

/**
 * Experimental Settings State
 */
export interface ExperimentalSettingsState {
  securityAlertsEnabled: boolean;
}

/**
 * Signature Request State
 */
export interface SignatureRequestState {
  securityAlertResponse?: SecurityAlertResponseState;
}

/**
 * RPC Event Stage
 */
export interface RpcEventStage {
  eventStage: string;
  rpcName: string;
  error?: Error;
}

/**
 * RPC Events State
 */
export interface RpcEventsState {
  signingEvent: RpcEventStage;
}

/**
 * Accounts State
 */
export interface AccountsState {
  reloadAccounts: boolean;
}
