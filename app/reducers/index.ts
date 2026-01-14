import bookmarksReducer from './bookmarks';
import browserReducer from './browser';
import engineReducer from '../core/redux/slices/engine';
import privacyReducer from './privacy';
import modalsReducer from './modals';
import settingsReducer from './settings';
import alertReducer from './alert';
import transactionReducer from './transaction';
import legalNoticesReducer from './legalNotices';
import userReducer, { UserState } from './user';
import wizardReducer from './wizard';
import onboardingReducer, { OnboardingState } from './onboarding';
import fiatOrders from './fiatOrders';
import swapsReducer from './swaps';
import signatureRequestReducer from './signatureRequest';
import notificationReducer from './notification';
import infuraAvailabilityReducer from './infuraAvailability';
import collectiblesReducer from './collectibles';
import navigationReducer, { NavigationState } from './navigation';
import networkOnboardReducer from './networkSelector';
import securityReducer, { SecurityState } from './security';
import { combineReducers, Reducer } from 'redux';
import experimentalSettingsReducer from './experimentalSettings';
import { EngineState } from '../core/Engine';
import rpcEventReducer from './rpcEvents';
import accountsReducer from './accounts';
import sdkReducer from './sdk';
import inpageProviderReducer from '../core/redux/slices/inpageProvider';
import confirmationMetricsReducer from '../core/redux/slices/confirmationMetrics';
import originThrottlingReducer from '../core/redux/slices/originThrottling';
import notificationsAccountsProvider from '../core/redux/slices/notifications';
import bannersReducer, { BannersState } from './banners';
import bridgeReducer from '../core/redux/slices/bridge';
import performanceReducer, {
  PerformanceState,
} from '../core/redux/slices/performance';
import { isTest } from '../util/test/utils';
import { SecurityAlertResponse } from '../components/Views/confirmations/legacy/components/BlockaidBanner/BlockaidBanner.types';

/**
 * State interface for the legalNotices reducer
 */
export interface LegalNoticesState {
  newPrivacyPolicyToastClickedOrClosed: boolean;
  newPrivacyPolicyToastShownDate: number | null;
}

/**
 * Collectible favorite item interface
 */
export interface CollectibleFavorite {
  tokenId: string;
  address: string;
}

/**
 * State interface for the collectibles reducer
 */
export interface CollectiblesState {
  favorites: Record<string, Record<string, CollectibleFavorite[]>>;
  isNftFetchingProgress: boolean;
}

/**
 * State interface for the privacy reducer
 */
export interface PrivacyState {
  approvedHosts: Record<string, boolean>;
  revealSRPTimestamps: number[];
}

/**
 * Bookmark item interface
 */
export interface Bookmark {
  url: string;
  name?: string;
}

/**
 * State type for the bookmarks reducer (array of bookmarks)
 */
export type BookmarksState = Bookmark[];

/**
 * Browser history item interface
 */
export interface BrowserHistoryItem {
  url: string;
  name: string;
}

/**
 * Browser tab interface
 */
export interface BrowserTab {
  url: string;
  id: number;
  linkType?: string;
}

/**
 * Browser favicon interface
 */
export interface BrowserFavicon {
  origin: string;
  url: string;
}

/**
 * State interface for the browser reducer
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
 * State interface for the modals reducer
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
 * State interface for the settings reducer
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
 * State interface for the alert reducer
 */
export interface AlertState {
  isVisible: boolean;
  autodismiss: number | null;
  content: string | null;
  data: unknown;
}

/**
 * Transaction data interface
 */
export interface TransactionData {
  data: string | undefined;
  from: string | undefined;
  gas: string | undefined;
  gasPrice: string | undefined;
  to: string | undefined;
  value: string | undefined;
  maxFeePerGas: string | undefined;
  maxPriorityFeePerGas: string | undefined;
}

/**
 * Selected asset interface for transactions
 */
export interface SelectedAsset {
  address?: string;
  decimals?: number;
  image?: string;
  isETH?: boolean;
  name?: string;
  symbol?: string;
  tokenId?: string;
}

/**
 * State interface for the transaction reducer
 */
export interface TransactionState {
  ensRecipient: string | undefined;
  assetType: 'ETH' | 'ERC20' | 'ERC721' | undefined;
  selectedAsset: SelectedAsset;
  transaction: TransactionData;
  warningGasPriceHigh: string | undefined;
  transactionTo: string | undefined;
  transactionToName: string | undefined;
  transactionFromName: string | undefined;
  transactionValue: string | undefined;
  symbol: string | undefined;
  paymentRequest: unknown;
  readableValue: string | undefined;
  id: string | undefined;
  type: string | undefined;
  proposedNonce: string | undefined;
  nonce: string | undefined;
  securityAlertResponses: Record<string, unknown>;
  useMax: boolean;
  maxValueMode?: boolean;
}

/**
 * State interface for the wizard reducer
 */
export interface WizardState {
  step: number;
}

/**
 * Notification types enum
 */
export type NotificationType = 'transaction' | 'simple';

/**
 * Base notification item interface
 */
export interface BaseNotificationItem {
  id: string;
  isVisible: boolean;
  autodismiss: number;
  status: string;
  type: NotificationType;
}

/**
 * Transaction notification item interface
 */
export interface TransactionNotificationItem extends BaseNotificationItem {
  type: 'transaction';
  transaction: {
    id: string;
    [key: string]: unknown;
  };
}

/**
 * Simple notification item interface
 */
export interface SimpleNotificationItem extends BaseNotificationItem {
  type: 'simple';
  title: string;
  description: string;
}

/**
 * Union type for notification items
 */
export type NotificationItem =
  | TransactionNotificationItem
  | SimpleNotificationItem;

/**
 * State interface for the notification reducer
 */
export interface NotificationState {
  notifications: NotificationItem[];
}

/**
 * Swaps feature flags interface
 */
export interface SwapsFeatureFlags {
  smartTransactions?: {
    mobileActive?: boolean;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Swaps chain state interface
 */
export interface SwapsChainState {
  isLive: boolean;
  featureFlags: SwapsFeatureFlags | undefined;
}

/**
 * State interface for the swaps reducer
 */
export interface SwapsState {
  isLive: boolean;
  hasOnboarded: boolean;
  featureFlags: SwapsFeatureFlags | undefined;
  [chainId: string]: boolean | SwapsFeatureFlags | SwapsChainState | undefined;
}

/**
 * State interface for the infuraAvailability reducer
 */
export interface InfuraAvailabilityState {
  isBlocked: boolean;
}

/**
 * Network state interface for networkOnboarded reducer
 */
export interface NetworkState {
  showNetworkOnboarding: boolean;
  nativeToken: string;
  networkType: string;
  networkUrl: string;
}

/**
 * Switched network state interface
 */
export interface SwitchedNetworkState {
  networkUrl: string;
  networkStatus: boolean;
}

/**
 * State interface for the networkOnboarded reducer
 */
export interface NetworkOnboardedState {
  networkOnboardedState: Record<string, boolean>;
  networkState: NetworkState;
  switchedNetwork: SwitchedNetworkState;
}

/**
 * State interface for the experimentalSettings reducer
 */
export interface ExperimentalSettingsState {
  securityAlertsEnabled: boolean;
}

/**
 * State interface for the signatureRequest reducer
 */
export interface SignatureRequestState {
  securityAlertResponse?: SecurityAlertResponse;
}

/**
 * Infer state from a reducer
 *
 * @template reducer A reducer function
 */
export type StateFromReducer<reducer> = reducer extends Reducer<
  infer State,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any
>
  ? State
  : never;

// TODO: Convert all reducers to valid TypeScript Redux reducers, and add them
// to this type. Once that is complete, we can automatically generate this type
// using the `StateFromReducersMapObject` type from redux.
// Note: The explicit interfaces defined above (LegalNoticesState, BrowserState, etc.)
// document the expected state shapes and can be used for type-safe access to state
// properties. The RootState interface uses 'any' for JavaScript reducers to maintain
// compatibility with the existing codebase until those reducers are converted to TypeScript.
export interface RootState {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  legalNotices: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  collectibles: any;
  engine: { backgroundState: EngineState };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  privacy: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bookmarks: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  browser: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  modals: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  settings: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  alert: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transaction: any;
  user: UserState;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  wizard: any;
  onboarding: OnboardingState;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  notification: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  swaps: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fiatOrders: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  infuraAvailability: any;
  navigation: NavigationState;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  networkOnboarded: any;
  security: SecurityState;
  sdk: StateFromReducer<typeof sdkReducer>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  experimentalSettings: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signatureRequest: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rpcEvents: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  accounts: any;
  inpageProvider: StateFromReducer<typeof inpageProviderReducer>;
  confirmationMetrics: StateFromReducer<typeof confirmationMetricsReducer>;
  originThrottling: StateFromReducer<typeof originThrottlingReducer>;
  notifications: StateFromReducer<typeof notificationsAccountsProvider>;
  bridge: StateFromReducer<typeof bridgeReducer>;
  banners: BannersState;
  performance?: PerformanceState;
}

const baseReducers = {
  legalNotices: legalNoticesReducer,
  collectibles: collectiblesReducer,
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  engine: engineReducer as any,
  privacy: privacyReducer,
  bookmarks: bookmarksReducer,
  browser: browserReducer,
  modals: modalsReducer,
  settings: settingsReducer,
  alert: alertReducer,
  transaction: transactionReducer,
  user: userReducer,
  wizard: wizardReducer,
  onboarding: onboardingReducer,
  notification: notificationReducer,
  signatureRequest: signatureRequestReducer,
  swaps: swapsReducer,
  fiatOrders,
  infuraAvailability: infuraAvailabilityReducer,
  navigation: navigationReducer,
  networkOnboarded: networkOnboardReducer,
  security: securityReducer,
  sdk: sdkReducer,
  experimentalSettings: experimentalSettingsReducer,
  rpcEvents: rpcEventReducer,
  accounts: accountsReducer,
  inpageProvider: inpageProviderReducer,
  originThrottling: originThrottlingReducer,
  notifications: notificationsAccountsProvider,
  bridge: bridgeReducer,
  banners: bannersReducer,
  confirmationMetrics: confirmationMetricsReducer,
};

if (isTest) {
  // @ts-expect-error - it's expected to not exist, it should only exist in not production environments
  baseReducers.performance = performanceReducer;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rootReducer = combineReducers(baseReducers) as unknown as Reducer<RootState, any>;

export default rootReducer;
