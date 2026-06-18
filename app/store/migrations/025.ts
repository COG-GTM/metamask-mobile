import { isObject } from '@metamask/utils';
import { ETHERSCAN_SUPPORTED_CHAIN_IDS } from '@metamask/preferences-controller';

export default function migrate(state: unknown): unknown {
  if (!isObject(state)) return state;

  try {
    Object.values(ETHERSCAN_SUPPORTED_CHAIN_IDS).forEach((hexChainId) => {
      const privacy = state.privacy as Record<string, unknown> | undefined;
      const thirdPartyApiMode = isObject(privacy)
        ? (privacy.thirdPartyApiMode as boolean | undefined) ?? true
        : true;

      if (!isObject(state.engine)) return;
      if (!isObject(state.engine.backgroundState)) return;

      const preferencesController = state.engine.backgroundState
        .PreferencesController as Record<string, unknown> | undefined;

      if (isObject(preferencesController)) {
        if (preferencesController.showIncomingTransactions) {
          preferencesController.showIncomingTransactions = {
            ...(preferencesController.showIncomingTransactions as Record<string, unknown>),
            [hexChainId]: thirdPartyApiMode,
          };
        } else {
          preferencesController.showIncomingTransactions = {
            [hexChainId]: thirdPartyApiMode,
          };
        }
      }
    });

    const privacy = state.privacy as Record<string, unknown> | undefined;
    if (isObject(privacy) && privacy.thirdPartyApiMode !== undefined) {
      delete privacy.thirdPartyApiMode;
    }

    return state;
  } catch (e) {
    return state;
  }
}
