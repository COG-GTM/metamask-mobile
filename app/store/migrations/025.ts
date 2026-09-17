import { ETHERSCAN_SUPPORTED_CHAIN_IDS } from '@metamask/preferences-controller';

interface MigrationState {
  privacy: {
    thirdPartyApiMode?: boolean;
  };
  engine: {
    backgroundState: {
      PreferencesController: {
        showIncomingTransactions?: Record<string, boolean>;
      };
    };
  };
}

export default function migrate(state: unknown) {
  const migrationState = state as MigrationState;
  try {
    Object.values(ETHERSCAN_SUPPORTED_CHAIN_IDS).forEach((hexChainId) => {
      const thirdPartyApiMode =
        migrationState?.privacy?.thirdPartyApiMode ?? true;
      if (
        migrationState?.engine?.backgroundState?.PreferencesController
          ?.showIncomingTransactions
      ) {
        migrationState.engine.backgroundState.PreferencesController.showIncomingTransactions =
          {
            ...migrationState.engine.backgroundState.PreferencesController
              .showIncomingTransactions,
            [hexChainId]: thirdPartyApiMode,
          };
      } else if (
        migrationState?.engine?.backgroundState?.PreferencesController
      ) {
        migrationState.engine.backgroundState.PreferencesController.showIncomingTransactions =
          { [hexChainId]: thirdPartyApiMode };
      }
    });

    if (migrationState?.privacy?.thirdPartyApiMode !== undefined) {
      delete migrationState.privacy.thirdPartyApiMode;
    }

    return state;
  } catch (e) {
    return state;
  }
}
