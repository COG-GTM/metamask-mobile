import { ETHERSCAN_SUPPORTED_CHAIN_IDS } from '@metamask/preferences-controller';

/**
 * Subset of the persisted state read and written by this migration.
 */
interface MigrationState {
  privacy?: {
    thirdPartyApiMode?: boolean;
    [key: string]: unknown;
  };
  engine?: {
    backgroundState?: {
      PreferencesController?: {
        showIncomingTransactions?: Record<string, boolean>;
        [key: string]: unknown;
      };
    };
  };
}

export default function migrate(state: unknown) {
  const migratedState = state as MigrationState;
  try {
    Object.values(ETHERSCAN_SUPPORTED_CHAIN_IDS).forEach((hexChainId) => {
      const thirdPartyApiMode =
        migratedState?.privacy?.thirdPartyApiMode ?? true;
      const preferencesController =
        migratedState?.engine?.backgroundState?.PreferencesController;
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

    if (migratedState?.privacy?.thirdPartyApiMode !== undefined) {
      delete migratedState.privacy.thirdPartyApiMode;
    }

    return migratedState;
  } catch (e) {
    return migratedState;
  }
}
