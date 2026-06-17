import { ETHERSCAN_SUPPORTED_CHAIN_IDS } from '@metamask/preferences-controller';

interface PreferencesControllerState {
  showIncomingTransactions?: unknown;
  [key: string]: unknown;
}

interface MigrationState {
  privacy?: {
    thirdPartyApiMode?: unknown;
    [key: string]: unknown;
  };
  engine?: {
    backgroundState?: {
      PreferencesController?: PreferencesControllerState;
      [key: string]: unknown;
    };
  };
  [key: string]: unknown;
}

export default function migrate(state: unknown): Record<string, unknown> {
  const typedState = state as MigrationState;
  try {
    const preferencesController =
      typedState?.engine?.backgroundState?.PreferencesController;
    Object.values(ETHERSCAN_SUPPORTED_CHAIN_IDS).forEach((hexChainId) => {
      const thirdPartyApiMode = typedState?.privacy?.thirdPartyApiMode ?? true;
      if (preferencesController?.showIncomingTransactions) {
        preferencesController.showIncomingTransactions = {
          ...(preferencesController.showIncomingTransactions as object),
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

    return typedState as unknown as Record<string, unknown>;
  } catch (e) {
    return typedState as unknown as Record<string, unknown>;
  }
}
