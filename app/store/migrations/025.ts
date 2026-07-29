import { ETHERSCAN_SUPPORTED_CHAIN_IDS } from '@metamask/preferences-controller';

/**
 * Shape of the persisted state this migration expects. Every access below is
 * optionally chained, mirroring the original implementation.
 */
interface MigrationState {
  engine?: {
    backgroundState?: {
      PreferencesController?: {
        showIncomingTransactions?: Record<string, boolean>;
      };
    };
  };
  privacy?: {
    thirdPartyApiMode?: boolean;
  };
}

export default function migrate(state: unknown): Record<string, unknown> {
  const typedState = state as MigrationState;
  try {
    Object.values(ETHERSCAN_SUPPORTED_CHAIN_IDS).forEach((hexChainId) => {
      const thirdPartyApiMode = typedState?.privacy?.thirdPartyApiMode ?? true;
      const preferencesControllerState =
        typedState?.engine?.backgroundState?.PreferencesController;
      if (preferencesControllerState?.showIncomingTransactions) {
        preferencesControllerState.showIncomingTransactions = {
          ...preferencesControllerState.showIncomingTransactions,
          [hexChainId]: thirdPartyApiMode,
        };
      } else if (preferencesControllerState) {
        preferencesControllerState.showIncomingTransactions = {
          [hexChainId]: thirdPartyApiMode,
        };
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
