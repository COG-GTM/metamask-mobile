import { ETHERSCAN_SUPPORTED_CHAIN_IDS } from '@metamask/preferences-controller';

interface Migration25State {
  privacy?: {
    thirdPartyApiMode?: unknown;
  };
  engine: {
    backgroundState: {
      PreferencesController: {
        showIncomingTransactions?: Record<string, unknown>;
      };
    };
  };
}

export default function migrate(state: unknown) {
  const typedState = state as Migration25State;
  try {
    Object.values(ETHERSCAN_SUPPORTED_CHAIN_IDS).forEach((hexChainId) => {
      const thirdPartyApiMode = typedState?.privacy?.thirdPartyApiMode ?? true;
      if (
        typedState?.engine?.backgroundState?.PreferencesController
          ?.showIncomingTransactions
      ) {
        typedState.engine.backgroundState.PreferencesController.showIncomingTransactions =
          {
            ...typedState.engine.backgroundState.PreferencesController
              .showIncomingTransactions,
            [hexChainId]: thirdPartyApiMode,
          };
      } else if (typedState?.engine?.backgroundState?.PreferencesController) {
        typedState.engine.backgroundState.PreferencesController.showIncomingTransactions =
          { [hexChainId]: thirdPartyApiMode };
      }
    });

    if (typedState?.privacy?.thirdPartyApiMode !== undefined) {
      delete typedState.privacy.thirdPartyApiMode;
    }

    return typedState;
  } catch (e) {
    return typedState;
  }
}
