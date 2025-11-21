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
import networkOnboardReducer, { initialState as networkOnboardInitialState } from './networkSelector';
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
 * Legal notices state interface
 */
export interface LegalNoticesState {
  newPrivacyPolicyToastClickedOrClosed: boolean;
  newPrivacyPolicyToastShownDate: number | null;
}

/**
 * Collectibles state interface
 */
export interface CollectiblesState {
  favorites: {
    [address: string]: {
      [chainId: string]: Array<{
        tokenId: string;
        address: string;
      }>;
    };
  };
  isNftFetchingProgress: boolean;
}

/**
 * Privacy state interface
 */
export interface PrivacyState {
  approvedHosts: {
    [hostname: string]: boolean;
  };
  revealSRPTimestamps: number[];
}

/**
 * Bookmark interface
 */
export interface Bookmark {
  url: string;
  name?: string;
}

/**
 * Bookmarks state type (array of bookmarks)
 */
export type BookmarksState = Bookmark[];

/**
 * Browser tab interface for Redux state
 */
export interface BrowserTabRedux {
  url: string;
  id: number;
  linkType?: string;
}

/**
 * Browser history item interface
 */
export interface BrowserHistoryItem {
  url: string;
  name: string;
}

/**
 * Browser favicon interface
 */
export interface BrowserFavicon {
  origin: string;
  url: string;
}

/**
 * Browser state interface
 */
export interface BrowserState {
  history: BrowserHistoryItem[];
  whitelist: string[];
  tabs: BrowserTabRedux[];
  favicons: BrowserFavicon[];
  activeTab: number | null;
  visitedDappsByHostname: {
    [hostname: string]: boolean;
  };
}

/**
 * Modals state interface
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
 * Settings state interface
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
 * Alert state interface
 */
export interface AlertState {
  isVisible: boolean;
  autodismiss: number | null;
  content: React.ReactNode | null;
  data: unknown | null;
}

/**
 * Transaction asset interface
 */
export interface TransactionAsset {
  isETH?: boolean;
  symbol?: string;
  tokenId?: string;
  address?: string;
  [key: string]: unknown;
}

/**
 * Transaction object interface
 */
export interface TransactionObject {
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
 * Transaction state interface
 */
export interface TransactionState {
  ensRecipient?: string;
  assetType?: string;
  selectedAsset: TransactionAsset;
  transaction: TransactionObject;
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
  securityAlertResponses: {
    [transactionId: string]: SecurityAlertResponse;
  };
  useMax: boolean;
  maxValueMode?: boolean;
}

/**
 * Wizard state interface
 */
export interface WizardState {
  step: number;
}

/**
 * Notification item interface
 */
export interface NotificationItem {
  id: string;
  isVisible: boolean;
  autodismiss: number;
  type: string;
  status?: string;
  transaction?: unknown;
  title?: string;
  description?: string;
}

/**
 * Notification state interface
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
  featureFlags?: SwapsFeatureFlags;
}

/**
 * Swaps state interface
 */
export interface SwapsState {
  isLive: boolean;
  hasOnboarded: boolean;
  featureFlags?: SwapsFeatureFlags;
  [chainId: string]: SwapsChainState | boolean | SwapsFeatureFlags | undefined;
}

/**
 * Infura availability state interface
 */
export interface InfuraAvailabilityState {
  isBlocked: boolean;
}

/**
 * Network state interface
 */
export interface NetworkState {
  showNetworkOnboarding: boolean;
  nativeToken: string;
  networkType: string;
  networkUrl: string;
}

/**
 * Switched network interface
 */
export interface SwitchedNetwork {
  networkUrl: string;
  networkStatus: boolean;
}

/**
 * Network onboarded state interface
 */
export interface NetworkOnboardedState {
  networkOnboardedState: {
    [key: string]: boolean;
  };
  networkState: NetworkState;
  switchedNetwork: SwitchedNetwork;
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
  legalNotices: StateFromReducer<typeof legalNoticesReducer>;
  collectibles: StateFromReducer<typeof collectiblesReducer>;
  engine: { backgroundState: EngineState };
  privacy: StateFromReducer<typeof privacyReducer>;
  bookmarks: StateFromReducer<typeof bookmarksReducer>;
  browser: StateFromReducer<typeof browserReducer>;
  modals: StateFromReducer<typeof modalsReducer>;
  settings: StateFromReducer<typeof settingsReducer>;
  alert: StateFromReducer<typeof alertReducer>;
  transaction: StateFromReducer<typeof transactionReducer>;
  user: UserState;
  wizard: StateFromReducer<typeof wizardReducer>;
  onboarding: OnboardingState;
  notification: StateFromReducer<typeof notificationReducer>;
  swaps: StateFromReducer<typeof swapsReducer>;
  fiatOrders: StateFromReducer<typeof fiatOrders>;
  infuraAvailability: StateFromReducer<typeof infuraAvailabilityReducer>;
  navigation: NavigationState;
  networkOnboarded: StateFromReducer<typeof networkOnboardReducer>;
  security: SecurityState;
  sdk: StateFromReducer<typeof sdkReducer>;
  experimentalSettings: StateFromReducer<typeof experimentalSettingsReducer>;
  signatureRequest: StateFromReducer<typeof signatureRequestReducer>;
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
