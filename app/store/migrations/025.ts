import { ETHERSCAN_SUPPORTED_CHAIN_IDS } from '@metamask/preferences-controller';
import { hasProperty, isObject } from '@metamask/utils';

export default function migrate(state: unknown) {
  try {
    if (!isObject(state)) {
      return state;
    }

    const thirdPartyApiMode =
      isObject(state.privacy) && hasProperty(state.privacy, 'thirdPartyApiMode')
        ? state.privacy.thirdPartyApiMode
        : true;
    const backgroundState =
      isObject(state.engine) && isObject(state.engine.backgroundState)
        ? state.engine.backgroundState
        : undefined;
    const preferencesController =
      backgroundState && isObject(backgroundState.PreferencesController)
        ? backgroundState.PreferencesController
        : undefined;

    Object.values(ETHERSCAN_SUPPORTED_CHAIN_IDS).forEach((hexChainId) => {
      if (
        preferencesController &&
        isObject(preferencesController.showIncomingTransactions)
      ) {
        preferencesController.showIncomingTransactions = {
          ...preferencesController.showIncomingTransactions,
          [hexChainId]: thirdPartyApiMode,
        };
      } else if (preferencesController) {
        preferencesController.showIncomingTransactions = {
          [hexChainId]: thirdPartyApiMode,
        };
      }
    });

    if (
      isObject(state.privacy) &&
      hasProperty(state.privacy, 'thirdPartyApiMode')
    ) {
      delete state.privacy.thirdPartyApiMode;
    }

    return state;
  } catch (e) {
    return state;
  }
}
