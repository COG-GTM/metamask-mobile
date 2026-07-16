import { ETHERSCAN_SUPPORTED_CHAIN_IDS } from '@metamask/preferences-controller';
import { isObject } from '@metamask/utils';

export default function migrate(state: unknown) {
  try {
    if (!isObject(state)) {
      return state;
    }

    const engine = isObject(state.engine) ? state.engine : undefined;
    const backgroundState =
      engine && isObject(engine.backgroundState)
        ? engine.backgroundState
        : undefined;
    const preferencesController =
      backgroundState && isObject(backgroundState.PreferencesController)
        ? backgroundState.PreferencesController
        : undefined;
    const privacy = isObject(state.privacy) ? state.privacy : undefined;

    Object.values(ETHERSCAN_SUPPORTED_CHAIN_IDS).forEach((hexChainId) => {
      const thirdPartyApiMode = privacy?.thirdPartyApiMode ?? true;
      if (preferencesController?.showIncomingTransactions) {
        preferencesController.showIncomingTransactions = {
          ...(isObject(preferencesController.showIncomingTransactions)
            ? preferencesController.showIncomingTransactions
            : {}),
          [hexChainId]: thirdPartyApiMode,
        };
      } else if (preferencesController) {
        preferencesController.showIncomingTransactions = {
          [hexChainId]: thirdPartyApiMode,
        };
      }
    });

    if (privacy?.thirdPartyApiMode !== undefined) {
      delete privacy.thirdPartyApiMode;
    }

    return state;
  } catch {
    return state;
  }
}
