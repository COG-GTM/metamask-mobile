/**
 * TypeScript interfaces for Redux state slices
 * These interfaces replace the `any` types in the RootState interface
 */

/**
 * Alert state interface
 * Manages the visibility and content of global alerts
 */
export interface AlertState {
  isVisible: boolean;
  autodismiss: number | null;
  content: string | null;
  data: unknown | null;
}

/**
 * Bookmark interface for individual bookmarks
 */
export interface Bookmark {
  url: string;
  name?: string;
}

/**
 * Bookmarks state is an array of Bookmark objects
 */
export type BookmarksState = Bookmark[];

/**
 * Browser tab interface
 */
export interface BrowserTab {
  id: number;
  url: string;
  linkType?: string;
}

/**
 * Browser history entry interface
 */
export interface BrowserHistoryEntry {
  url: string;
  name: string;
}

/**
 * Favicon entry interface
 */
export interface FaviconEntry {
  origin: string;
  url: string;
}

/**
 * Browser state interface
 * Manages browser tabs, history, and related data
 */
export interface BrowserState {
  history: BrowserHistoryEntry[];
  whitelist: string[];
  tabs: BrowserTab[];
  favicons: FaviconEntry[];
  activeTab: number | null;
  visitedDappsByHostname: Record<string, boolean>;
}

/**
 * Collectible favorite item interface
 */
export interface CollectibleFavorite {
  tokenId: string;
  address: string;
}

/**
 * Collectibles state interface
 * Manages NFT favorites and fetching state
 */
export interface CollectiblesState {
  favorites: Record<string, Record<string, CollectibleFavorite[]>>;
  isNftFetchingProgress: boolean;
}

/**
 * Infura availability state interface
 */
export interface InfuraAvailabilityState {
  isBlocked: boolean;
}

/**
 * Modals state interface
 * Manages visibility of various modal dialogs
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
 * Privacy state interface
 * Manages approved hosts and SRP reveal timestamps
 */
export interface PrivacyState {
  approvedHosts: Record<string, boolean>;
  revealSRPTimestamps: number[];
}

/**
 * Settings state interface
 * Manages app settings and preferences
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
 * Transaction data interface
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
 * Selected asset interface
 */
export interface SelectedAsset {
  address?: string;
  decimals?: number;
  symbol?: string;
  tokenId?: string;
  isETH?: boolean;
  image?: string;
  name?: string;
  standard?: string;
}

/**
 * Security alert response interface
 */
export interface SecurityAlertResponseType {
  result_type?: string;
  reason?: string;
  features?: string[];
  block?: number;
  req?: unknown;
  chainId?: string;
}

/**
 * Transaction state interface
 * Manages the current transaction being prepared/sent
 */
export interface TransactionState {
  ensRecipient?: string;
  assetType?: 'ETH' | 'ERC20' | 'ERC721';
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
  securityAlertResponses: Record<string, SecurityAlertResponseType>;
  useMax?: boolean;
  maxValueMode?: boolean;
}

/**
 * Wizard state interface
 * Manages onboarding wizard progress
 */
export interface WizardState {
  step: number;
}

/**
 * Notification types enum
 */
export type NotificationType = 'TRANSACTION' | 'SIMPLE';

/**
 * Base notification interface
 */
export interface BaseNotification {
  id: string;
  isVisible: boolean;
  autodismiss: number;
  type: NotificationType;
  status?: string;
}

/**
 * Transaction notification interface
 */
export interface TransactionNotification extends BaseNotification {
  type: 'TRANSACTION';
  transaction: {
    id: string;
    [key: string]: unknown;
  };
}

/**
 * Simple notification interface
 */
export interface SimpleNotification extends BaseNotification {
  type: 'SIMPLE';
  title?: string;
  description?: string;
}

/**
 * Notification union type
 */
export type Notification = TransactionNotification | SimpleNotification;

/**
 * Notification state interface
 * Manages the notification queue
 */
export interface NotificationState {
  notifications: Notification[];
}

/**
 * Swaps chain state interface
 */
export interface SwapsChainState {
  isLive: boolean;
  featureFlags?: Record<string, unknown>;
}

/**
 * Swaps feature flags interface
 */
export interface SwapsFeatureFlags {
  smart_transactions?: Record<string, unknown>;
  smartTransactions?: {
    mobileActive?: boolean;
    [key: string]: unknown;
  };
}

/**
 * Swaps state interface
 * Manages swaps feature state and liveness
 */
export interface SwapsState {
  isLive: boolean;
  hasOnboarded: boolean;
  featureFlags?: SwapsFeatureFlags;
  [chainId: string]: SwapsChainState | boolean | SwapsFeatureFlags | undefined;
}

/**
 * Legal notices state interface
 */
export interface LegalNoticesState {
  newPrivacyPolicyToastClickedOrClosed: boolean;
  newPrivacyPolicyToastShownDate: number | null;
}

/**
 * Network onboarded state interface
 */
export interface NetworkOnboardedState {
  networkOnboardedState: Record<string, boolean>;
  networkState: {
    showNetworkOnboarding: boolean;
    nativeToken: string;
    networkType: string;
    networkUrl: string;
  };
  switchedNetwork: {
    networkUrl: string;
    networkStatus: boolean;
  };
}

/**
 * Experimental settings state interface
 */
export interface ExperimentalSettingsState {
  securityAlertsEnabled: boolean;
}

/**
 * Signature request state interface
 */
export interface SignatureRequestState {
  securityAlertResponse?: SecurityAlertResponseType;
}

/**
 * RPC event stage interface
 */
export interface RpcEventStage {
  eventStage: string;
  rpcName: string;
  error?: Error;
}

/**
 * RPC events state interface
 */
export interface RpcEventsState {
  signingEvent: RpcEventStage;
}

/**
 * Accounts state interface
 */
export interface AccountsState {
  reloadAccounts: boolean;
}
