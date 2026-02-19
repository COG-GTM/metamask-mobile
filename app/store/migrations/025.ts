import { ETHERSCAN_SUPPORTED_CHAIN_IDS } from '@metamask/preferences-controller';

interface MigrationState {
  engine?: {
    backgroundState?: {
      PreferencesController?: {
        showIncomingTransactions?: Record<string, boolean>;
        [key: string]: unknown;
      };
    };
  };
  privacy?: {
    thirdPartyApiMode?: boolean;
    [key: string]: unknown;
  };
}

export default function migrate(state: unknown): unknown {
  const s = state as MigrationState;
  try {
    Object.values(ETHERSCAN_SUPPORTED_CHAIN_IDS).forEach((hexChainId) => {
      const thirdPartyApiMode = s?.privacy?.thirdPartyApiMode ?? true;
      if (
        s?.engine?.backgroundState?.PreferencesController
          ?.showIncomingTransactions
      ) {
        s.engine.backgroundState.PreferencesController.showIncomingTransactions =
          {
            ...s.engine.backgroundState.PreferencesController
              .showIncomingTransactions,
            [hexChainId]: thirdPartyApiMode,
          };
      } else if (s?.engine?.backgroundState?.PreferencesController) {
        s.engine.backgroundState.PreferencesController.showIncomingTransactions =
          { [hexChainId]: thirdPartyApiMode };
      }
    });

    if (s?.privacy?.thirdPartyApiMode !== undefined) {
      delete s.privacy.thirdPartyApiMode;
    }

    return state;
  } catch (e) {
    return state;
  }
}
