import { ETHERSCAN_SUPPORTED_CHAIN_IDS } from '@metamask/preferences-controller';

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

export default function migrate(incomingState: unknown) {
  const state = incomingState as MigrationState;
  try {
    Object.values(ETHERSCAN_SUPPORTED_CHAIN_IDS).forEach((hexChainId) => {
      const thirdPartyApiMode = state?.privacy?.thirdPartyApiMode ?? true;
      const preferencesControllerState =
        state?.engine?.backgroundState?.PreferencesController;
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

    if (state?.privacy?.thirdPartyApiMode !== undefined) {
      delete state.privacy.thirdPartyApiMode;
    }

    return state;
  } catch (e) {
    return state;
  }
}
