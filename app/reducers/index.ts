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

export interface LegalNoticesState {
  newPrivacyPolicyToastClickedOrClosed: boolean;
  newPrivacyPolicyToastShownDate: number | null;
}

export interface CollectiblesFavorite {
  tokenId: string;
  address: string;
}

export interface CollectiblesState {
  favorites: Record<string, Record<string, CollectiblesFavorite[]>>;
  isNftFetchingProgress: boolean;
}

export interface PrivacyState {
  approvedHosts: Record<string, boolean>;
  revealSRPTimestamps: number[];
}

export interface Bookmark {
  url: string;
  name: string;
}

export interface BrowserTab {
  url: string;
  id: number;
  linkType?: string;
}

export interface BrowserFavicon {
  origin: string;
  url: string;
}

export interface BrowserState {
  history: { url: string; name: string }[];
  whitelist: string[];
  tabs: BrowserTab[];
  favicons: BrowserFavicon[];
  activeTab: number | null;
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

export interface TransactionInner {
  data: string | undefined;
  from: string | undefined;
  gas: string | undefined;
  gasPrice: string | undefined;
  to: string | undefined;
  value: string | undefined;
  maxFeePerGas: string | undefined;
  maxPriorityFeePerGas: string | undefined;
}

export interface TransactionState {
  ensRecipient: string | undefined;
  assetType: string | undefined;
  selectedAsset: Record<string, unknown>;
  transaction: TransactionInner;
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
  securityAlertResponses: Record<string, unknown>;
  useMax: boolean;
  maxValueMode?: boolean;
}

export interface WizardState {
  step: number;
}

export interface NotificationItem {
  id: string;
  isVisible: boolean;
  autodismiss?: number;
  title?: string;
  description?: string;
  status?: string;
  type?: string;
  transaction?: Record<string, unknown>;
}

export interface NotificationState {
  notifications: NotificationItem[];
}

export interface SwapsChainData {
  isLive: boolean;
  featureFlags: Record<string, unknown> | undefined;
}

export interface SwapsState {
  isLive: boolean;
  hasOnboarded: boolean;
  featureFlags: Record<string, unknown> | undefined;
  [chainId: string]: SwapsChainData | boolean | Record<string, unknown> | null | undefined;
}

export interface InfuraAvailabilityState {
  isBlocked: boolean;
}

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

export interface ExperimentalSettingsState {
  securityAlertsEnabled: boolean;
}

export interface SignatureRequestState {
  securityAlertResponse?: {
    reason?: string;
    result_type?: string;
    description?: string;
    features?: string[];
    block?: number;
    chainId?: string;
    source?: string;
    securityAlertId?: string;
    providerRequestsCount?: Record<string, number>;
    req?: Record<string, unknown>;
    [key: string]: unknown;
  };
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
  bookmarks: Bookmark[];
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
  collectibles: collectiblesReducer as Reducer<CollectiblesState>,
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  engine: engineReducer as any,
  privacy: privacyReducer as Reducer<PrivacyState>,
  bookmarks: bookmarksReducer as Reducer<Bookmark[]>,
  browser: browserReducer as Reducer<BrowserState>,
  modals: modalsReducer as Reducer<ModalsState>,
  settings: settingsReducer as Reducer<SettingsState>,
  alert: alertReducer as Reducer<AlertState>,
  transaction: transactionReducer as Reducer<TransactionState>,
  user: userReducer,
  wizard: wizardReducer as Reducer<WizardState>,
  onboarding: onboardingReducer,
  notification: notificationReducer as Reducer<NotificationState>,
  signatureRequest: signatureRequestReducer as Reducer<SignatureRequestState>,
  swaps: swapsReducer as Reducer<SwapsState>,
  fiatOrders,
  infuraAvailability: infuraAvailabilityReducer as Reducer<InfuraAvailabilityState>,
  navigation: navigationReducer,
  networkOnboarded: networkOnboardReducer as Reducer<NetworkOnboardedState>,
  security: securityReducer,
  sdk: sdkReducer,
  experimentalSettings: experimentalSettingsReducer as Reducer<ExperimentalSettingsState>,
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
