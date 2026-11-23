import { ETHERSCAN_SUPPORTED_CHAIN_IDS } from '@metamask/preferences-controller';

interface MigrationState {
  privacy?: { thirdPartyApiMode?: boolean };
  engine?: {
    backgroundState?: {
      PreferencesController?: {
        showIncomingTransactions?: Record<string, boolean>;
      };
    };
  };
}

export default function migrate(state: unknown) {
  const migratedState = state as MigrationState | undefined;
  try {
    Object.values(ETHERSCAN_SUPPORTED_CHAIN_IDS).forEach((hexChainId) => {
      const thirdPartyApiMode =
        migratedState?.privacy?.thirdPartyApiMode ?? true;
      if (
        migratedState?.engine?.backgroundState?.PreferencesController
          ?.showIncomingTransactions
      ) {
        migratedState.engine.backgroundState.PreferencesController.showIncomingTransactions =
          {
            ...migratedState.engine.backgroundState.PreferencesController
              .showIncomingTransactions,
            [hexChainId]: thirdPartyApiMode,
          };
      } else if (
        migratedState?.engine?.backgroundState?.PreferencesController
      ) {
        migratedState.engine.backgroundState.PreferencesController.showIncomingTransactions =
          { [hexChainId]: thirdPartyApiMode };
      }
    });

    if (migratedState?.privacy?.thirdPartyApiMode !== undefined) {
      delete migratedState.privacy.thirdPartyApiMode;
    }

    return migratedState;
  } catch (e) {
    return migratedState;
  }
}
