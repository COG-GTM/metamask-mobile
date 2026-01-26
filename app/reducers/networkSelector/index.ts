/**
 * Represents the network state during onboarding
 */
export interface NetworkStateInfo {
  showNetworkOnboarding: boolean;
  nativeToken: string;
  networkType: string;
  networkUrl: string;
}

/**
 * Represents the switched network state
 */
export interface SwitchedNetworkInfo {
  networkUrl: string;
  networkStatus: boolean;
}

/**
 * State shape for the networkOnboarded reducer
 */
export interface NetworkOnboardedState {
  networkOnboardedState: Record<string, boolean>;
  networkState: NetworkStateInfo;
  switchedNetwork: SwitchedNetworkInfo;
}

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

/**
 *
 * Network onboarding reducer
 * @returns
 */

/**
 * Action types for networkOnboarded reducer
 */
interface ShowNetworkOnboardingAction {
  type: 'SHOW_NETWORK_ONBOARDING';
  nativeToken: string;
  networkType: string;
  networkUrl: string;
  showNetworkOnboarding: boolean;
}

interface NetworkSwitchedAction {
  type: 'NETWORK_SWITCHED';
  networkUrl: string;
  networkStatus: boolean;
}

interface NetworkOnboardedAction {
  type: 'NETWORK_ONBOARDED';
  payload: string;
}

type NetworkOnboardAction =
  | ShowNetworkOnboardingAction
  | NetworkSwitchedAction
  | NetworkOnboardedAction;

function networkOnboardReducer(
  state: NetworkOnboardedState = initialState,
  action: NetworkOnboardAction,
): NetworkOnboardedState {
  switch (action.type) {
    case 'SHOW_NETWORK_ONBOARDING':
      return {
        ...state,
        networkState: {
          showNetworkOnboarding: action.showNetworkOnboarding,
          nativeToken: action.nativeToken,
          networkType: action.networkType,
          networkUrl: action.networkUrl,
        },
      };
    case 'NETWORK_SWITCHED':
      return {
        ...state,
        switchedNetwork: {
          networkUrl: action.networkUrl,
          networkStatus: action.networkStatus,
        },
      };
    case 'NETWORK_ONBOARDED':
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
