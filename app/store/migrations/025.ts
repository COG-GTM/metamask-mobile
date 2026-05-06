import { isObject, hasProperty } from '@metamask/utils';
import { ETHERSCAN_SUPPORTED_CHAIN_IDS } from '@metamask/preferences-controller';

export default function migrate(state: unknown) {
  if (!isObject(state)) {
    return state;
  }
  try {
    Object.values(ETHERSCAN_SUPPORTED_CHAIN_IDS).forEach((hexChainId) => {
      const thirdPartyApiMode =
        isObject(state.privacy) && hasProperty(state.privacy, 'thirdPartyApiMode')
          ? state.privacy.thirdPartyApiMode
          : true;
      const preferencesController =
        isObject(state.engine) && isObject(state.engine.backgroundState)
          ? state.engine.backgroundState.PreferencesController
          : undefined;
      if (
        isObject(preferencesController) &&
        hasProperty(preferencesController, 'showIncomingTransactions') &&
        preferencesController.showIncomingTransactions
      ) {
        preferencesController.showIncomingTransactions = {
          ...(preferencesController.showIncomingTransactions as Record<
            string,
            unknown
          >),
          [hexChainId]: thirdPartyApiMode,
        };
      } else if (isObject(preferencesController)) {
        preferencesController.showIncomingTransactions = {
          [hexChainId]: thirdPartyApiMode,
        };
      }
    });

    if (
      isObject(state.privacy) &&
      hasProperty(state.privacy, 'thirdPartyApiMode') &&
      state.privacy.thirdPartyApiMode !== undefined
    ) {
      delete state.privacy.thirdPartyApiMode;
    }

    return state;
  } catch (e) {
    return state;
  }
}
