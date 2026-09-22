import { hasProperty, isObject } from '@metamask/utils';
import { ETHERSCAN_SUPPORTED_CHAIN_IDS } from '@metamask/preferences-controller';
import { ensureValidState } from './util';

export default function migrate(state: unknown) {
  if (!ensureValidState(state, 25)) {
    return state;
  }

  try {
    const preferencesControllerState =
      state.engine.backgroundState.PreferencesController;
    const privacyState = hasProperty(state, 'privacy')
      ? state.privacy
      : undefined;

    Object.values(ETHERSCAN_SUPPORTED_CHAIN_IDS).forEach((hexChainId) => {
      const thirdPartyApiMode = isObject(privacyState)
        ? privacyState.thirdPartyApiMode ?? true
        : true;

      if (!isObject(preferencesControllerState)) {
        return;
      }

      if (isObject(preferencesControllerState.showIncomingTransactions)) {
        preferencesControllerState.showIncomingTransactions = {
          ...preferencesControllerState.showIncomingTransactions,
          [hexChainId]: thirdPartyApiMode,
        };
      } else {
        preferencesControllerState.showIncomingTransactions = {
          [hexChainId]: thirdPartyApiMode,
        };
      }
    });

    if (
      isObject(privacyState) &&
      privacyState.thirdPartyApiMode !== undefined
    ) {
      delete privacyState.thirdPartyApiMode;
    }

    return state;
  } catch (e) {
    return state;
  }
}
