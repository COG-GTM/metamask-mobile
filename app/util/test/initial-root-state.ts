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
// A cast is needed here because we use enums in some controllers, and TypeScript doesn't consider
// the string value of an enum as satisfying an enum type.
export const backgroundState: EngineState =
  initialBackgroundState as unknown as EngineState;

const initialRootState: RootState = {
  legalNotices: undefined as any,
  collectibles: undefined as any,
  engine: { backgroundState },
  privacy: undefined as any,
  bookmarks: undefined as any,
  browser: undefined as any,
  modals: undefined as any,
  settings: undefined as any,
  alert: undefined as any,
  transaction: undefined as any,
  user: userInitialState,
  wizard: undefined as any,
  onboarding: initialOnboardingState,
  notification: undefined as any,
  swaps: undefined as any,
  fiatOrders: initialFiatOrdersState,
  infuraAvailability: undefined as any,
  navigation: initialNavigationState,
  networkOnboarded: undefined as any,
  security: initialSecurityState,
  signatureRequest: undefined as any,
  sdk: {
    connections: {},
    approvedHosts: {},
    dappConnections: {},
  },
  experimentalSettings: undefined as any,
  rpcEvents: undefined as any,
  accounts: undefined as any,
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
