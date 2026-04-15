import { createSelector } from 'reselect';


import { selectEvmChainId } from './networkController';
import { createDeepEqualSelector } from './util';


const selectPreferencesControllerState = (state) =>
state.engine?.backgroundState?.PreferencesController;

export const selectIpfsGateway = createSelector(
  selectPreferencesControllerState,
  (preferencesControllerState) =>
  preferencesControllerState.ipfsGateway
);

export const selectUseNftDetection = createSelector(
  selectPreferencesControllerState,
  (preferencesControllerState) =>
  preferencesControllerState.useNftDetection
);

export const selectShowMultiRpcModal = createSelector(
  selectPreferencesControllerState,
  (preferencesControllerState) =>
  preferencesControllerState.showMultiRpcModal
);

export const selectUseTokenDetection = createSelector(
  selectPreferencesControllerState,
  (preferencesControllerState) =>
  preferencesControllerState.useTokenDetection
);

export const selectDisplayNftMedia = createSelector(
  selectPreferencesControllerState,
  (preferencesControllerState) =>
  preferencesControllerState.displayNftMedia
);

export const selectUseSafeChainsListValidation = createSelector(
  selectPreferencesControllerState,
  (preferencesControllerState) =>
  preferencesControllerState.useSafeChainsListValidation
);

export const selectTokenSortConfig = createSelector(
  selectPreferencesControllerState,
  (preferencesControllerState) =>
  preferencesControllerState.tokenSortConfig
);

export const selectTokenNetworkFilter = createSelector(
  selectPreferencesControllerState,
  (preferencesControllerState) =>
  preferencesControllerState.tokenNetworkFilter
);

export const selectIsTokenNetworkFilterEqualCurrentNetwork =
createDeepEqualSelector(
  selectPreferencesControllerState,
  (state) => selectEvmChainId(state),
  (preferencesControllerState, chainId) => {
    const tokenNetworkFilter =
    preferencesControllerState.tokenNetworkFilter || {};
    if (
    Object.keys(tokenNetworkFilter).length === 1 &&
    Object.keys(tokenNetworkFilter)[0] === chainId)
    {
      return true;
    }
    return false;
  }
);

// isMultiAccountBalancesEnabled is a patched property - ref patches/@metamask+preferences-controller+2.1.0.patch
export const selectIsMultiAccountBalancesEnabled = createSelector(
  selectPreferencesControllerState,
  (preferencesControllerState) =>

  preferencesControllerState.


  isMultiAccountBalancesEnabled
);

// showTestNetworks is a patched property - ref patches/@metamask+preferences-controller+2.1.0.patch
export const selectShowTestNetworks = createSelector(
  selectPreferencesControllerState,
  (preferencesControllerState) =>

  preferencesControllerState.


  showTestNetworks
);

export const selectShowIncomingTransactionNetworks = createSelector(
  selectPreferencesControllerState,
  (preferencesControllerState) =>

  preferencesControllerState.


  showIncomingTransactions
);

export const selectIsIpfsGatewayEnabled = createSelector(
  selectPreferencesControllerState,
  (preferencesControllerState) =>

  preferencesControllerState.


  isIpfsGatewayEnabled
);

export const selectIsSecurityAlertsEnabled = createSelector(
  selectPreferencesControllerState,
  (preferencesControllerState) =>

  preferencesControllerState.


  securityAlertsEnabled
);

export const selectSmartTransactionsOptInStatus = createSelector(
  selectPreferencesControllerState,
  (preferencesControllerState) =>
  preferencesControllerState.smartTransactionsOptInStatus
);

export const selectUseTransactionSimulations = createSelector(
  selectPreferencesControllerState,
  (preferencesControllerState) =>

  preferencesControllerState.


  useTransactionSimulations
);

export const selectPrivacyMode = createSelector(
  selectPreferencesControllerState,
  (preferencesControllerState) =>
  preferencesControllerState.privacyMode
);

export const selectSmartTransactionsMigrationApplied = createSelector(
  selectPreferencesControllerState,
  (preferencesControllerState) =>
  preferencesControllerState.featureFlags?.smartTransactionsMigrationApplied ?? false
);

export const selectSmartTransactionsBannerDismissed = createSelector(
  selectPreferencesControllerState,
  (preferencesControllerState) =>
  preferencesControllerState.featureFlags?.smartTransactionsBannerDismissed ?? false
);