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
 * State type for the legalNotices reducer
 */
export interface LegalNoticesState {
  newPrivacyPolicyToastClickedOrClosed: boolean;
  newPrivacyPolicyToastShownDate: number | null;
}

/**
 * State type for the collectibles reducer
 */
export interface CollectiblesState {
  favorites: Record<string, Record<string, { tokenId: string; address: string }[]>>;
  isNftFetchingProgress: boolean;
}

/**
 * State type for the privacy reducer
 */
export interface PrivacyState {
  approvedHosts: Record<string, boolean>;
  revealSRPTimestamps: number[];
}

/**
 * Bookmark type
 */
export interface Bookmark {
  url: string;
  name: string;
}

/**
 * State type for the bookmarks reducer (array of bookmarks)
 */
export type BookmarksState = Bookmark[];

/**
 * Browser tab type
 */
export interface BrowserTab {
  url: string;
  id: string;
  linkType?: string;
}

/**
 * Browser history entry type
 */
export interface BrowserHistoryEntry {
  url: string;
  name: string;
}

/**
 * Browser favicon type
 */
export interface BrowserFavicon {
  origin: string;
  url: string;
}

/**
 * State type for the browser reducer
 */
export interface BrowserState {
  history: BrowserHistoryEntry[];
  whitelist: string[];
  tabs: BrowserTab[];
  favicons: BrowserFavicon[];
  activeTab: string | null;
  visitedDappsByHostname: Record<string, boolean>;
}

/**
 * State type for the modals reducer
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
 * State type for the settings reducer
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
 * State type for the alert reducer
 */
export interface AlertState {
  isVisible: boolean;
  autodismiss: number | null;
  content: string | null;
  data: unknown | null;
}

/**
 * Transaction data type
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
 * Selected asset type
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
 * State type for the transaction reducer
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
  securityAlertResponses: Record<string, unknown>;
  useMax?: boolean;
  maxValueMode?: boolean;
}

/**
 * State type for the wizard reducer
 */
export interface WizardState {
  step: number;
}

/**
 * Notification item type
 */
export interface NotificationItem {
  id: string;
  isVisible: boolean;
  autodismiss?: number;
  title?: string;
  description?: string;
  status?: string;
  type: string;
  transaction?: unknown;
}

/**
 * State type for the notification reducer
 */
export interface NotificationState {
  notifications: NotificationItem[];
}

/**
 * Swaps chain data type
 */
export interface SwapsChainData {
  isLive: boolean;
  featureFlags?: Record<string, unknown>;
}

/**
 * State type for the swaps reducer
 */
export interface SwapsState {
  isLive?: boolean;
  hasOnboarded?: boolean;
  featureFlags?: Record<string, unknown>;
  [chainId: string]: boolean | Record<string, unknown> | SwapsChainData | null | undefined;
}

/**
 * State type for the infuraAvailability reducer
 */
export interface InfuraAvailabilityState {
  isBlocked: boolean;
}

/**
 * Network state type
 */
export interface NetworkState {
  showNetworkOnboarding: boolean;
  nativeToken: string;
  networkType: string;
  networkUrl: string;
}

/**
 * Switched network type
 */
export interface SwitchedNetwork {
  networkUrl: string;
  networkStatus: boolean;
}

/**
 * State type for the networkOnboarded reducer
 */
export interface NetworkOnboardedState {
  networkOnboardedState: Record<string, boolean>;
  networkState: NetworkState;
  switchedNetwork: SwitchedNetwork;
}

/**
 * State type for the experimentalSettings reducer
 */
export interface ExperimentalSettingsState {
  securityAlertsEnabled: boolean;
}

/**
 * State type for the signatureRequest reducer
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
// Note: Many properties are optional to support partial state in test utilities
export interface RootState {
  legalNotices?: LegalNoticesState;
  collectibles?: CollectiblesState;
  engine: { backgroundState: EngineState };
  privacy?: PrivacyState;
  bookmarks?: BookmarksState;
  browser?: BrowserState;
  modals?: ModalsState;
  settings?: SettingsState;
  alert?: AlertState;
  transaction?: TransactionState;
  user: UserState;
  wizard?: WizardState;
  onboarding: OnboardingState;
  notification?: NotificationState;
  swaps?: SwapsState;
  fiatOrders: StateFromReducer<typeof fiatOrders>;
  infuraAvailability?: InfuraAvailabilityState;
  navigation: NavigationState;
  networkOnboarded?: NetworkOnboardedState;
  security: SecurityState;
  sdk: StateFromReducer<typeof sdkReducer>;
  experimentalSettings?: ExperimentalSettingsState;
  signatureRequest?: SignatureRequestState;
  rpcEvents?: iEventGroup;
  accounts?: iAccountEvent;
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
