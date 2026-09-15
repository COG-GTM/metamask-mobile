import { ETHERSCAN_SUPPORTED_CHAIN_IDS } from '@metamask/preferences-controller';

interface Migration25State {
  privacy?: {
    thirdPartyApiMode?: boolean;
  };
  engine?: {
    backgroundState?: {
      PreferencesController?: {
        showIncomingTransactions?: Record<string, boolean>;
      };
    };
  };
}

export default function migrate(state: unknown) {
  const typedState = state as Migration25State;
  try {
    Object.values(ETHERSCAN_SUPPORTED_CHAIN_IDS).forEach((hexChainId) => {
      const thirdPartyApiMode = typedState?.privacy?.thirdPartyApiMode ?? true;
      const preferencesController =
        typedState?.engine?.backgroundState?.PreferencesController;
      if (
        preferencesController?.showIncomingTransactions
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

    const privacy = typedState?.privacy;
    if (privacy?.thirdPartyApiMode !== undefined) {
      delete privacy.thirdPartyApiMode;
    }

    return state;
  } catch (e) {
    return state;
  }
}
