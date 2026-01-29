import { SecurityAlertResponse } from '../components/Views/confirmations/legacy/components/BlockaidBanner/BlockaidBanner.types';

export interface FavoriteCollectible {
  tokenId: string;
  address: string;
}

export interface CollectiblesState {
  favorites: Record<string, Record<string, FavoriteCollectible[]>>;
  isNftFetchingProgress: boolean;
}

export interface PrivacyState {
  approvedHosts: Record<string, boolean>;
  revealSRPTimestamps: number[];
}

export interface Bookmark {
  url: string;
  name?: string;
}

export type BookmarksState = Bookmark[];

export interface BrowserHistoryEntry {
  url: string;
  name: string;
}

export interface BrowserTab {
  url: string;
  id: number | string;
  linkType?: string;
}

export interface BrowserFavicon {
  origin: string;
  url: string;
}

export interface BrowserState {
  history: BrowserHistoryEntry[];
  whitelist: string[];
  tabs: BrowserTab[];
  favicons: BrowserFavicon[];
  activeTab: number | string | null;
  visitedDappsByHostname: Record<string, boolean>;
}

export interface ModalsState {
  networkModalVisible: boolean;
  shouldNetworkSwitchPopToWallet: boolean;
  collectibleContractModalVisible: boolean;
  dappTransactionModalVisible: boolean;
  signMessageModalVisible: boolean;
  infoNetworkModalVisible?: boolean;
}

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

export interface AlertState {
  isVisible: boolean;
  autodismiss: number | null;
  content: string | null;
  data: unknown | null;
}

export type AssetType = 'ETH' | 'ERC20' | 'ERC721';

export interface SelectedAsset {
  isETH?: boolean;
  symbol?: string;
  tokenId?: string;
  address?: string;
  decimals?: number;
  image?: string;
  name?: string;
  standard?: string;
}

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

export interface TransactionState {
  ensRecipient?: string;
  assetType?: AssetType;
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
  securityAlertResponses: Record<string, SecurityAlertResponse>;
  useMax: boolean;
  maxValueMode?: boolean;
}

export interface WizardState {
  step: number;
}

export type NotificationType = 'transaction' | 'simple';

export interface BaseNotification {
  id: string;
  isVisible: boolean;
  autodismiss: number;
  status?: string;
  type: NotificationType;
}

export interface TransactionNotification extends BaseNotification {
  type: 'transaction';
  transaction: {
    id: string;
    [key: string]: unknown;
  };
}

export interface SimpleNotification extends BaseNotification {
  type: 'simple';
  title?: string;
  description?: string;
}

export type Notification = TransactionNotification | SimpleNotification;

export interface NotificationState {
  notifications: Notification[];
}

export interface SwapsChainState {
  isLive: boolean;
  featureFlags?: Record<string, unknown>;
}

export interface SwapsFeatureFlags {
  smart_transactions?: Record<string, unknown>;
  smartTransactions?: {
    mobileActive?: boolean;
    [key: string]: unknown;
  };
}

export interface SwapsState {
  isLive: boolean;
  hasOnboarded: boolean;
  featureFlags?: SwapsFeatureFlags;
  [chainId: string]: SwapsChainState | boolean | SwapsFeatureFlags | undefined;
}

export interface InfuraAvailabilityState {
  isBlocked: boolean;
}

export interface NetworkState {
  showNetworkOnboarding: boolean;
  nativeToken: string;
  networkType: string;
  networkUrl: string;
}

export interface SwitchedNetwork {
  networkUrl: string;
  networkStatus: boolean;
}

export interface NetworkOnboardedState {
  networkOnboardedState: Record<string, boolean>;
  networkState: NetworkState;
  switchedNetwork: SwitchedNetwork;
}

export interface ExperimentalSettingsState {
  securityAlertsEnabled: boolean;
}

export interface SignatureRequestState {
  securityAlertResponse?: SecurityAlertResponse;
}

export type { iEventGroup as RpcEventsState } from './rpcEvents';
export type { iAccountEvent as AccountsState } from './accounts';
export type { LegalNoticesState } from './legalNotices';
