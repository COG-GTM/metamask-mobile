import { ETHERSCAN_SUPPORTED_CHAIN_IDS } from '@metamask/preferences-controller';

interface MigrationState {
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
  const typedState = state as MigrationState;
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
