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
import { combineReducers, Reducer, AnyAction } from 'redux';
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
import type { SecurityAlertResponse } from '@metamask/transaction-controller';

export interface LegalNoticesState {
  newPrivacyPolicyToastClickedOrClosed: boolean;
  newPrivacyPolicyToastShownDate: number | null;
}

export interface FavoriteCollectible {
  tokenId: string;
  address: string;
}

export interface CollectiblesState {
  favorites: {
    [address: string]: {
      [chainId: string]: FavoriteCollectible[];
    };
  };
  isNftFetchingProgress: boolean;
}

export interface Bookmark {
  url: string;
  name?: string;
}

export type BookmarksState = Bookmark[];

export interface BrowserStateTab {
  url: string;
  id: number;
  linkType?: string;
}

export interface BrowserStateFavicon {
  origin: string;
  url: string;
}

export interface BrowserState {
  history: { url: string; name: string }[];
  whitelist: string[];
  tabs: BrowserStateTab[];
  favicons: BrowserStateFavicon[];
  activeTab: number | null;
  visitedDappsByHostname: {
    [hostname: string]: boolean;
  };
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
  content: React.ReactNode | null;
  data: Record<string, unknown> | null;
}

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

export interface SelectedAsset {
  tokenId?: string;
  isETH?: boolean;
  symbol?: string;
  address?: string;
  [key: string]: unknown;
}

export interface TransactionState {
  ensRecipient?: string;
  assetType?: string;
  selectedAsset: SelectedAsset;
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
    [transactionId: string]: unknown;
  };
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
  type: string;
  transaction?: unknown;
}

export interface NotificationState {
  notifications: NotificationItem[];
}

export interface SwapsFeatureFlags {
  smartTransactions?: {
    mobileActive?: boolean;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface SwapsChainState {
  isLive: boolean;
  featureFlags?: SwapsFeatureFlags;
}

export interface SwapsState {
  isLive: boolean;
  hasOnboarded: boolean;
  featureFlags?: SwapsFeatureFlags;
  '0x1': SwapsChainState;
  [chainId: string]: boolean | SwapsChainState | SwapsFeatureFlags | undefined;
}

export interface InfuraAvailabilityState {
  isBlocked: boolean;
}

export interface NetworkOnboardedState {
  networkOnboardedState: {
    [key: string]: boolean;
  };
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
  securityAlertResponse?: SecurityAlertResponse;
}

export interface PrivacyState {
  approvedHosts: {
    [hostname: string]: boolean;
  };
  revealSRPTimestamps: number[];
}

/**
 * Infer state from a reducer
 *
 * @template reducer A reducer function
 */
export type StateFromReducer<reducer> = reducer extends Reducer<
  infer State,
  AnyAction
>
  ? State
  : never;

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
  legalNotices: legalNoticesReducer as unknown as Reducer<LegalNoticesState, AnyAction>,
  collectibles: collectiblesReducer as unknown as Reducer<CollectiblesState, AnyAction>,
  engine: engineReducer as Reducer<RootState['engine'], AnyAction>,
  privacy: privacyReducer as unknown as Reducer<PrivacyState, AnyAction>,
  bookmarks: bookmarksReducer as unknown as Reducer<BookmarksState, AnyAction>,
  browser: browserReducer as unknown as Reducer<BrowserState, AnyAction>,
  modals: modalsReducer as unknown as Reducer<ModalsState, AnyAction>,
  settings: settingsReducer as unknown as Reducer<SettingsState, AnyAction>,
  alert: alertReducer as unknown as Reducer<AlertState, AnyAction>,
  transaction: transactionReducer as unknown as Reducer<TransactionState, AnyAction>,
  user: userReducer,
  wizard: wizardReducer as unknown as Reducer<WizardState, AnyAction>,
  onboarding: onboardingReducer,
  notification: notificationReducer as unknown as Reducer<NotificationState, AnyAction>,
  signatureRequest: signatureRequestReducer as unknown as Reducer<SignatureRequestState, AnyAction>,
  swaps: swapsReducer as unknown as Reducer<SwapsState, AnyAction>,
  fiatOrders,
  infuraAvailability: infuraAvailabilityReducer as unknown as Reducer<InfuraAvailabilityState, AnyAction>,
  navigation: navigationReducer,
  networkOnboarded: networkOnboardReducer as unknown as Reducer<NetworkOnboardedState, AnyAction>,
  security: securityReducer as unknown as Reducer<SecurityState, AnyAction>,
  sdk: sdkReducer,
  experimentalSettings: experimentalSettingsReducer as unknown as Reducer<ExperimentalSettingsState, AnyAction>,
  rpcEvents: rpcEventReducer as unknown as Reducer<iEventGroup, AnyAction>,
  accounts: accountsReducer as unknown as Reducer<iAccountEvent, AnyAction>,
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

const rootReducer = combineReducers<RootState, AnyAction>(baseReducers);

export default rootReducer;
