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
import legalNoticesReducer from '../../reducers/legalNotices';
import collectiblesReducer from '../../reducers/collectibles';
import privacyReducer from '../../reducers/privacy';
import bookmarksReducer from '../../reducers/bookmarks';
import browserReducer from '../../reducers/browser';
import modalsReducer from '../../reducers/modals';
import settingsReducer from '../../reducers/settings';
import alertReducer from '../../reducers/alert';
import transactionReducer from '../../reducers/transaction';
import wizardReducer from '../../reducers/wizard';
import notificationReducer from '../../reducers/notification';
import { initialState as swapsInitialState } from '../../reducers/swaps';
import infuraAvailabilityReducer from '../../reducers/infuraAvailability';
import { isTest } from './utils';

/**
 * Derives a reducer's initial state by dispatching a no-op init action, so the
 * fixture always stays in sync with each reducer's `initialState`.
 */
const getInitialReducerState = <S>(
  reducer: (state: undefined, action: never) => S,
): S => reducer(undefined, { type: '@@INIT' } as never);

// A cast is needed here because we use enums in some controllers, and TypeScript doesn't consider
// the string value of an enum as satisfying an enum type.
export const backgroundState: EngineState =
  initialBackgroundState as unknown as EngineState;

const initialRootState: RootState = {
  legalNotices: getInitialReducerState(legalNoticesReducer),
  collectibles: getInitialReducerState(collectiblesReducer),
  engine: { backgroundState },
  privacy: getInitialReducerState(privacyReducer),
  bookmarks: getInitialReducerState(bookmarksReducer),
  browser: getInitialReducerState(browserReducer),
  modals: getInitialReducerState(modalsReducer),
  settings: getInitialReducerState(settingsReducer),
  alert: getInitialReducerState(alertReducer),
  transaction: getInitialReducerState(transactionReducer),
  user: userInitialState,
  wizard: getInitialReducerState(wizardReducer),
  onboarding: initialOnboardingState,
  notification: getInitialReducerState(notificationReducer),
  swaps: swapsInitialState,
  fiatOrders: initialFiatOrdersState,
  infuraAvailability: getInitialReducerState(infuraAvailabilityReducer),
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
