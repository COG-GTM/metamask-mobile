import { cloneDeep, merge } from 'lodash';
import type { RootState } from '../../reducers';
import type { EngineState } from '../../core/Engine';
import type { DeepPartial } from './renderWithProvider';
import { initialState as initialFiatOrdersState } from '../../reducers/fiatOrders';
import { initialState as initialSecurityState } from '../../reducers/security';
import { initialState as initialInpageProvider } from '../../core/redux/slices/inpageProvider';
import { initialState as confirmationMetrics } from '../../core/redux/slices/confirmationMetrics';
import { initialState as originThrottling } from '../../core/redux/slices/originThrottling';
import { initialState as initialBridgeState } from '../../core/redux/slices/bridge';
import initialBackgroundState from './initial-background-state.json';
import { userInitialState } from '../../reducers/user';
import { initialNavigationState } from '../../reducers/navigation';
import { initialOnboardingState } from '../../reducers/onboarding';
import { initialState as initialPerformanceState } from '../../core/redux/slices/performance';
import { isTest } from './utils';
import { initialState as initialLegalNoticesState } from '../../reducers/legalNotices';
import { initialState as initialCollectiblesState } from '../../reducers/collectibles';
import { initialState as initialPrivacyState } from '../../reducers/privacy';
import { initialState as initialBookmarksState } from '../../reducers/bookmarks';
import { initialState as initialBrowserState } from '../../reducers/browser';
import { initialState as initialModalsState } from '../../reducers/modals';
import { initialState as initialSettingsState } from '../../reducers/settings';
import { initialState as initialAlertState } from '../../reducers/alert';
import { initialState as initialTransactionState } from '../../reducers/transaction';
import { initialState as initialWizardState } from '../../reducers/wizard';
import { initialState as initialNotificationState } from '../../reducers/notification';
import { initialState as initialSwapsState } from '../../reducers/swaps';
import { initialState as initialInfuraAvailabilityState } from '../../reducers/infuraAvailability';
import { initialState as initialNetworkOnboardedState } from '../../reducers/networkSelector';
import { initialState as initialSignatureRequestState } from '../../reducers/signatureRequest';
import { initialState as initialExperimentalSettingsState } from '../../reducers/experimentalSettings';
import { initialState as initialRpcEventsState } from '../../reducers/rpcEvents';
import { initialState as initialAccountsState } from '../../reducers/accounts';
// A cast is needed here because we use enums in some controllers, and TypeScript doesn't consider
// the string value of an enum as satisfying an enum type.
export const backgroundState: EngineState =
  initialBackgroundState as unknown as EngineState;

const initialRootState: RootState = {
  legalNotices: initialLegalNoticesState,
  collectibles: initialCollectiblesState,
  engine: { backgroundState },
  privacy: initialPrivacyState,
  bookmarks: initialBookmarksState,
  browser: initialBrowserState,
  modals: initialModalsState,
  settings: initialSettingsState,
  alert: initialAlertState,
  transaction: initialTransactionState,
  user: userInitialState,
  wizard: initialWizardState,
  onboarding: initialOnboardingState,
  notification: initialNotificationState,
  swaps: initialSwapsState,
  fiatOrders: initialFiatOrdersState,
  infuraAvailability: initialInfuraAvailabilityState,
  navigation: initialNavigationState,
  networkOnboarded: initialNetworkOnboardedState,
  security: initialSecurityState,
  signatureRequest: initialSignatureRequestState,
  sdk: {
    connections: {},
    approvedHosts: {},
    dappConnections: {},
  },
  experimentalSettings: initialExperimentalSettingsState,
  rpcEvents: initialRpcEventsState,
  accounts: initialAccountsState,
  inpageProvider: initialInpageProvider,
  confirmationMetrics,
  originThrottling,
  notifications: {},
  bridge: initialBridgeState,
  banners: {
    dismissedBanners: [],
  },
};

if (isTest) {
  initialRootState.performance = initialPerformanceState;
}

export default initialRootState;

export function makeRootState(overrides: DeepPartial<RootState> = {}): RootState {
  return merge(cloneDeep(initialRootState), overrides) as RootState;
}
