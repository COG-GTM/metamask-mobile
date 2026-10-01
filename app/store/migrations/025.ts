import { ETHERSCAN_SUPPORTED_CHAIN_IDS } from '@metamask/preferences-controller';

export default function migrate(state: unknown): Record<string, unknown> {
  const typedState = state as {
    privacy?: { thirdPartyApiMode?: boolean };
    engine?: {
      backgroundState?: {
        PreferencesController?: {
          showIncomingTransactions?: Record<string, boolean>;
        };
      };
    };
  };
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

    return state as Record<string, unknown>;
  } catch (e) {
    return state as Record<string, unknown>;
  }
}
