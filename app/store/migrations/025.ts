import { isObject } from '@metamask/utils';
import { ETHERSCAN_SUPPORTED_CHAIN_IDS } from '@metamask/preferences-controller';

export default function migrate(state: unknown): unknown {
  if (!isObject(state)) {
    return state;
  }

  try {
    const engineState = state.engine as Record<string, Record<string, unknown>> | undefined;
    const privacy = (state as Record<string, unknown>).privacy as Record<string, unknown> | undefined;

    Object.values(ETHERSCAN_SUPPORTED_CHAIN_IDS).forEach((hexChainId) => {
      const thirdPartyApiMode = privacy?.thirdPartyApiMode ?? true;
      const preferencesController = engineState?.backgroundState?.PreferencesController as Record<string, unknown> | undefined;

      if (preferencesController?.showIncomingTransactions) {
        preferencesController.showIncomingTransactions = {
          ...(preferencesController.showIncomingTransactions as Record<string, boolean>),
          [hexChainId]: thirdPartyApiMode as boolean,
        };
      } else if (preferencesController) {
        preferencesController.showIncomingTransactions = { [hexChainId]: thirdPartyApiMode as boolean };
      }
    });

    if (privacy?.thirdPartyApiMode !== undefined) {
      delete privacy.thirdPartyApiMode;
    }

    return state;
  } catch (e) {
    return state;
  }
}
