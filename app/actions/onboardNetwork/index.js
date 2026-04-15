/**
 * Handle the onboarding network action
 *
 * @param {object} chainId - The chain ID of the current selected network
 * @returns
 */
export const onboardNetworkAction = (chainId) => ({
  type: 'NETWORK_ONBOARDED',
  payload: chainId
});

export const networkSwitched = ({
  networkUrl,
  networkStatus



}) => ({
  type: 'NETWORK_SWITCHED',
  networkUrl,
  networkStatus
});

export const showNetworkOnboardingAction = ({
  networkUrl,
  networkType,
  nativeToken,
  showNetworkOnboarding





}) => ({
  type: 'SHOW_NETWORK_ONBOARDING',
  networkUrl,
  networkType,
  nativeToken,
  showNetworkOnboarding
});