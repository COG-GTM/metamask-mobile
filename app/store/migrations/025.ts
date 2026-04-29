import { ETHERSCAN_SUPPORTED_CHAIN_IDS } from '@metamask/preferences-controller';

export default function migrate(state: Record<string, unknown>) {
  try {
    const engineState = state?.engine as Record<string, Record<string, Record<string, unknown>>> | undefined;
    const privacy = state?.privacy as Record<string, unknown> | undefined;
    Object.values(ETHERSCAN_SUPPORTED_CHAIN_IDS).forEach((hexChainId) => {
      const thirdPartyApiMode = privacy?.thirdPartyApiMode ?? true;
      const preferencesController = engineState?.backgroundState?.PreferencesController as Record<string, unknown> | undefined;
      if (preferencesController?.showIncomingTransactions) {
        preferencesController.showIncomingTransactions =
          {
            ...(preferencesController.showIncomingTransactions as Record<string, unknown>),
            [hexChainId]: thirdPartyApiMode,
          };
      } else if (preferencesController) {
        preferencesController.showIncomingTransactions =
          { [hexChainId]: thirdPartyApiMode };
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
