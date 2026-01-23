import type { RootState } from '../../reducers';
import type { EngineState } from '../../core/Engine';
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
import { collectiblesInitialState } from '../../reducers/collectibles';
import { privacyInitialState } from '../../reducers/privacy';
import { bookmarksInitialState } from '../../reducers/bookmarks';
import { browserInitialState } from '../../reducers/browser';
import { modalsInitialState } from '../../reducers/modals';
import { settingsInitialState } from '../../reducers/settings';
import { alertInitialState } from '../../reducers/alert';
import { transactionInitialState } from '../../reducers/transaction';
import { wizardInitialState } from '../../reducers/wizard';
import { initialState as initialNotificationState } from '../../reducers/notification';
import { initialState as initialSwapsState } from '../../reducers/swaps';
import { infuraAvailabilityInitialState } from '../../reducers/infuraAvailability';
// A cast is needed here because we use enums in some controllers, and TypeScript doesn't consider
// the string value of an enum as satisfying an enum type.
export const backgroundState: EngineState =
  initialBackgroundState as unknown as EngineState;

const initialRootState: RootState = {
  legalNotices: undefined,
  collectibles: collectiblesInitialState,
  engine: { backgroundState },
  privacy: privacyInitialState,
  bookmarks: bookmarksInitialState,
  browser: browserInitialState,
  modals: modalsInitialState,
  settings: settingsInitialState,
  alert: alertInitialState,
  transaction: transactionInitialState,
  user: userInitialState,
  wizard: wizardInitialState,
  onboarding: initialOnboardingState,
  notification: initialNotificationState,
  swaps: initialSwapsState,
  fiatOrders: initialFiatOrdersState,
  infuraAvailability: infuraAvailabilityInitialState,
  navigation: initialNavigationState,
  networkOnboarded: undefined,
  security: initialSecurityState,
  signatureRequest: undefined,
  sdk: {
    connections: {},
    approvedHosts: {},
    dappConnections: {},
  },
  experimentalSettings: undefined,
  rpcEvents: undefined,
  accounts: undefined,
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
