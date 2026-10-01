import { ETHERSCAN_SUPPORTED_CHAIN_IDS } from '@metamask/preferences-controller';

export default function migrate(state: unknown) {
  const typedState = state as {
    privacy?: { thirdPartyApiMode?: boolean };
    engine?: {
      backgroundState?: {
        PreferencesController?: {
          showIncomingTransactions?: Record<string, unknown>;
        };
      };
    };
  };
  try {
    Object.values(ETHERSCAN_SUPPORTED_CHAIN_IDS).forEach((hexChainId) => {
      const thirdPartyApiMode = typedState?.privacy?.thirdPartyApiMode ?? true;
      const preferencesController =
        typedState?.engine?.backgroundState?.PreferencesController;
      if (preferencesController?.showIncomingTransactions) {
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

    if (typedState?.privacy?.thirdPartyApiMode !== undefined) {
      delete typedState.privacy.thirdPartyApiMode;
    }

    return state;
  } catch (e) {
    return state;
  }
}
