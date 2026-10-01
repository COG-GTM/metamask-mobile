export const NETWORK_ONBOARDED = 'NETWORK_ONBOARDED' as const;
export const NETWORK_SWITCHED = 'NETWORK_SWITCHED' as const;
export const SHOW_NETWORK_ONBOARDING = 'SHOW_NETWORK_ONBOARDING' as const;

export interface NetworkOnboardedAction {
  type: typeof NETWORK_ONBOARDED;
  payload: string;
}

export interface NetworkSwitchedAction {
  type: typeof NETWORK_SWITCHED;
  networkUrl: string;
  networkStatus: boolean;
}

export interface ShowNetworkOnboardingAction {
  type: typeof SHOW_NETWORK_ONBOARDING;
  networkUrl: string;
  networkType: string;
  nativeToken: string;
  showNetworkOnboarding: boolean;
}

export type OnboardNetworkAction =
  | NetworkOnboardedAction
  | NetworkSwitchedAction
  | ShowNetworkOnboardingAction;

/**
 * Handle the onboarding network action
 *
 * @param {object} chainId - The chain ID of the current selected network
 * @returns
 */
export const onboardNetworkAction = (
  chainId: string,
): NetworkOnboardedAction => ({
  type: NETWORK_ONBOARDED,
  payload: chainId,
});

export const networkSwitched = ({
  networkUrl,
  networkStatus,
}: {
  networkUrl: string;
  networkStatus: boolean;
}): NetworkSwitchedAction => ({
  type: NETWORK_SWITCHED,
  networkUrl,
  networkStatus,
});

export const showNetworkOnboardingAction = ({
  networkUrl,
  networkType,
  nativeToken,
  showNetworkOnboarding,
}: {
  networkUrl: string;
  networkType: string;
  nativeToken: string;
  showNetworkOnboarding: boolean;
}): ShowNetworkOnboardingAction => ({
  type: SHOW_NETWORK_ONBOARDING,
  networkUrl,
  networkType,
  nativeToken,
  showNetworkOnboarding,
});
