import { isObject, hasProperty } from '@metamask/utils';
import { ETHERSCAN_SUPPORTED_CHAIN_IDS } from '@metamask/preferences-controller';

export default function migrate(state: unknown): unknown {
  if (!isObject(state)) {
    return state;
  }

  try {
    const privacy = state.privacy as Record<string, unknown> | undefined;
    const thirdPartyApiMode = privacy?.thirdPartyApiMode ?? true;

    if (isObject(state.engine) && isObject(state.engine.backgroundState)) {
      const preferencesControllerState = state.engine.backgroundState.PreferencesController as Record<string, unknown> | undefined;

      Object.values(ETHERSCAN_SUPPORTED_CHAIN_IDS).forEach((hexChainId) => {
        if (preferencesControllerState?.showIncomingTransactions) {
          preferencesControllerState.showIncomingTransactions = {
            ...(preferencesControllerState.showIncomingTransactions as Record<string, boolean>),
            [hexChainId]: thirdPartyApiMode as boolean,
          };
        } else if (preferencesControllerState) {
          preferencesControllerState.showIncomingTransactions = {
            [hexChainId]: thirdPartyApiMode as boolean,
          };
        }
      });
    }

    if (privacy && hasProperty(privacy, 'thirdPartyApiMode')) {
      delete privacy.thirdPartyApiMode;
    }

    return state;
  } catch (e) {
    return state;
  }
}
