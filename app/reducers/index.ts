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
import rpcEventReducer, { iEventGroup } from './rpcEvents';
import accountsReducer, { iAccountEvent } from './accounts';
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
 * Favorite collectible item
 */
interface FavoriteCollectible {
  tokenId: string;
  address: string;
}

/**
 * State interface for the collectibles reducer
 */
export interface CollectiblesState {
  favorites: {
    [address: string]: {
      [chainId: string]: FavoriteCollectible[];
    };
  };
  isNftFetchingProgress: boolean;
}

/**
 * State interface for the privacy reducer
 */
export interface PrivacyState {
  approvedHosts: { [hostname: string]: boolean };
  revealSRPTimestamps: number[];
}

/**
 * Bookmark item
 */
interface Bookmark {
  url: string;
  name?: string;
}

/**
 * State type for the bookmarks reducer (array of bookmarks)
 */
export type BookmarksState = Bookmark[];

/**
 * Browser history item
 */
interface BrowserHistoryItem {
  url: string;
  name: string;
}

/**
 * Browser tab
 */
interface BrowserTab {
  url: string;
  id: number;
  linkType?: string;
}

/**
 * Favicon entry
 */
interface Favicon {
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
  favicons: Favicon[];
  activeTab: number | null;
  visitedDappsByHostname: { [hostname: string]: boolean };
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
  data: unknown | null;
}

/**
 * Transaction data within the transaction state
 */
interface TransactionData {
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
 * Selected asset in transaction
 */
interface SelectedAsset {
  tokenId?: string;
  isETH?: boolean;
  symbol?: string;
  address?: string;
  decimals?: number;
  image?: string;
  name?: string;
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
  paymentRequest: unknown | undefined;
  readableValue: string | undefined;
  id: string | undefined;
  type: string | undefined;
  proposedNonce: string | undefined;
  nonce: string | undefined;
  securityAlertResponses: { [transactionId: string]: unknown };
  useMax?: boolean;
  maxValueMode?: boolean;
}

/**
 * State interface for the wizard reducer
 */
export interface WizardState {
  step: number;
}

/**
 * Notification item types
 */
type NotificationType = 'transaction' | 'simple';

/**
 * Base notification properties
 */
interface BaseNotification {
  id: string;
  isVisible: boolean;
  autodismiss: number;
  type: NotificationType;
  status?: string;
}

/**
 * Transaction notification
 */
interface TransactionNotification extends BaseNotification {
  type: 'transaction';
  transaction: {
    id: string;
    [key: string]: unknown;
  };
}

/**
 * Simple notification
 */
interface SimpleNotification extends BaseNotification {
  type: 'simple';
  title: string;
  description: string;
}

/**
 * Union type for notifications
 */
type Notification = TransactionNotification | SimpleNotification;

/**
 * State interface for the notification reducer
 */
export interface NotificationState {
  notifications: Notification[];
}

/**
 * Swaps feature flags
 */
interface SwapsFeatureFlags {
  smartTransactions?: {
    mobileActive?: boolean;
    [key: string]: unknown;
  };
  smart_transactions?: unknown;
  [key: string]: unknown;
}

/**
 * Chain-specific swaps state
 */
interface SwapsChainState {
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
  [chainId: string]: boolean | SwapsFeatureFlags | undefined | SwapsChainState;
}

/**
 * State interface for the infuraAvailability reducer
 */
export interface InfuraAvailabilityState {
  isBlocked: boolean;
}

/**
 * Network state within networkOnboarded
 */
interface NetworkOnboardedNetworkState {
  showNetworkOnboarding: boolean;
  nativeToken: string;
  networkType: string;
  networkUrl: string;
}

/**
 * Switched network state
 */
interface SwitchedNetworkState {
  networkUrl: string;
  networkStatus: boolean;
}

/**
 * State interface for the networkOnboarded reducer
 */
export interface NetworkOnboardedState {
  networkOnboardedState: { [chainId: string]: boolean };
  networkState: NetworkOnboardedNetworkState;
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
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any
>
  ? State
  : never;

// TODO: Convert all reducers to valid TypeScript Redux reducers, and add them
// to this type. Once that is complete, we can automatically generate this type
// using the `StateFromReducersMapObject` type from redux.
export interface RootState {
  legalNotices: LegalNoticesState;
  collectibles: CollectiblesState;
  engine: { backgroundState: EngineState };
  privacy: PrivacyState;
  bookmarks: BookmarksState;
  browser: BrowserState;
  modals: ModalsState;
  settings: SettingsState;
  alert: AlertState;
  transaction: TransactionState;
  user: UserState;
  wizard: WizardState;
  onboarding: OnboardingState;
  notification: NotificationState;
  swaps: SwapsState;
  fiatOrders: StateFromReducer<typeof fiatOrders>;
  infuraAvailability: InfuraAvailabilityState;
  navigation: NavigationState;
  networkOnboarded: NetworkOnboardedState;
  security: SecurityState;
  sdk: StateFromReducer<typeof sdkReducer>;
  experimentalSettings: ExperimentalSettingsState;
  signatureRequest: SignatureRequestState;
  rpcEvents: iEventGroup;
  accounts: iAccountEvent;
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

// TODO: Fix the Action type. It's set to `any` now because some of the
// TypeScript reducers have invalid actions
// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rootReducer = combineReducers<RootState, any>(baseReducers);

export default rootReducer;
