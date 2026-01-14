export const SHOW_NETWORK_ONBOARDING = 'SHOW_NETWORK_ONBOARDING';
export const NETWORK_SWITCHED = 'NETWORK_SWITCHED';
export const NETWORK_ONBOARDED = 'NETWORK_ONBOARDED';

export interface NetworkState {
  showNetworkOnboarding: boolean;
  nativeToken: string;
  networkType: string;
  networkUrl: string;
}

export interface SwitchedNetwork {
  networkUrl: string;
  networkStatus: boolean;
}

export interface NetworkOnboardedState {
  networkOnboardedState: Record<string, boolean>;
  networkState: NetworkState;
  switchedNetwork: SwitchedNetwork;
}

interface ShowNetworkOnboardingAction {
  type: typeof SHOW_NETWORK_ONBOARDING;
  nativeToken: string;
  networkType: string;
  networkUrl: string;
  showNetworkOnboarding: boolean;
}

interface NetworkSwitchedAction {
  type: typeof NETWORK_SWITCHED;
  networkUrl: string;
  networkStatus: boolean;
}

interface NetworkOnboardedAction {
  type: typeof NETWORK_ONBOARDED;
  payload: string;
}

type NetworkOnboardAction =
  | ShowNetworkOnboardingAction
  | NetworkSwitchedAction
  | NetworkOnboardedAction;

export const initialState: NetworkOnboardedState = {
  networkOnboardedState: {},
  networkState: {
    showNetworkOnboarding: false,
    nativeToken: '',
    networkType: '',
    networkUrl: '',
  },
  switchedNetwork: {
    networkUrl: '',
    networkStatus: false,
  },
};

function networkOnboardReducer(
  state: NetworkOnboardedState = initialState,
  action: NetworkOnboardAction,
): NetworkOnboardedState {
  switch (action.type) {
    case SHOW_NETWORK_ONBOARDING:
      return {
        ...state,
        networkState: {
          showNetworkOnboarding: action.showNetworkOnboarding,
          nativeToken: action.nativeToken,
          networkType: action.networkType,
          networkUrl: action.networkUrl,
        },
      };
    case NETWORK_SWITCHED:
      return {
        ...state,
        switchedNetwork: {
          networkUrl: action.networkUrl,
          networkStatus: action.networkStatus,
        },
      };
    case NETWORK_ONBOARDED:
      return {
        ...state,
        networkState: {
          showNetworkOnboarding: false,
          nativeToken: '',
          networkType: '',
          networkUrl: '',
        },
        networkOnboardedState: {
          ...state.networkOnboardedState,
          [action.payload]: true,
        },
      };
    default:
      return state;
  }
}

export default networkOnboardReducer;
