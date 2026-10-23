import { createSlice } from '@reduxjs/toolkit';
import {
  ActionType,
  type NetworkSwitchedAction,
  type OnboardNetworkAction,
  type ShowNetworkOnboardingAction,
} from '../../actions/onboardNetwork';

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
 * Network onboarding slice. Handles the legacy action types dispatched by
 * app/actions/onboardNetwork, so action shapes stay unchanged.
 */
const networkOnboardedSlice = createSlice({
  name: 'networkOnboarded',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(
        ActionType.SHOW_NETWORK_ONBOARDING,
        (state, action: ShowNetworkOnboardingAction) => ({
          ...state,
          networkState: {
            showNetworkOnboarding: action.showNetworkOnboarding,
            nativeToken: action.nativeToken,
            networkType: action.networkType,
            networkUrl: action.networkUrl,
          },
        }),
      )
      .addCase(
        ActionType.NETWORK_SWITCHED,
        (state, action: NetworkSwitchedAction) => ({
          ...state,
          switchedNetwork: {
            networkUrl: action.networkUrl,
            networkStatus: action.networkStatus,
          },
        }),
      )
      .addCase(
        ActionType.NETWORK_ONBOARDED,
        (state, action: OnboardNetworkAction) => ({
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
        }),
      );
  },
});

/**
 * Network onboarding reducer
 */
export default networkOnboardedSlice.reducer;
