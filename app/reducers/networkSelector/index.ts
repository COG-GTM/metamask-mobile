/* eslint-disable @typescript-eslint/default-param-last */
import {
  OnboardNetworkAction,
  NETWORK_ONBOARDED,
  NETWORK_SWITCHED,
  SHOW_NETWORK_ONBOARDING,
} from '../../actions/onboardNetwork';

export interface NetworkOnboardedState {
  networkOnboardedState: { [chainId: string]: boolean };
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
  action: OnboardNetworkAction,
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
