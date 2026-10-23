import type { Action as ReduxAction } from 'redux';

export enum ActionType {
  NETWORK_ONBOARDED = 'NETWORK_ONBOARDED',
  NETWORK_SWITCHED = 'NETWORK_SWITCHED',
  SHOW_NETWORK_ONBOARDING = 'SHOW_NETWORK_ONBOARDING',
}

export interface OnboardNetworkAction
  extends ReduxAction<ActionType.NETWORK_ONBOARDED> {
  payload: string;
}

export interface NetworkSwitchedAction
  extends ReduxAction<ActionType.NETWORK_SWITCHED> {
  networkUrl: string;
  networkStatus: boolean;
}

export interface ShowNetworkOnboardingAction
  extends ReduxAction<ActionType.SHOW_NETWORK_ONBOARDING> {
  networkUrl: string;
  networkType: string;
  nativeToken: string;
  showNetworkOnboarding: boolean;
}

export type Action =
  | OnboardNetworkAction
  | NetworkSwitchedAction
  | ShowNetworkOnboardingAction;

/**
 * Handle the onboarding network action
 *
 * @param {object} chainId - The chain ID of the current selected network
 * @returns
 */
export const onboardNetworkAction = (chainId: string): OnboardNetworkAction => ({
  type: ActionType.NETWORK_ONBOARDED,
  payload: chainId,
});

export const networkSwitched = ({
  networkUrl,
  networkStatus,
}: {
  networkUrl: string;
  networkStatus: boolean;
}): NetworkSwitchedAction => ({
  type: ActionType.NETWORK_SWITCHED,
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
  type: ActionType.SHOW_NETWORK_ONBOARDING,
  networkUrl,
  networkType,
  nativeToken,
  showNetworkOnboarding,
});
