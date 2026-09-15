import { ETHERSCAN_SUPPORTED_CHAIN_IDS } from '@metamask/preferences-controller';

interface LegacyState {
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

export default function migrate(stateArg: unknown) {
  const state = stateArg as LegacyState;
  try {
    Object.values(ETHERSCAN_SUPPORTED_CHAIN_IDS).forEach((hexChainId) => {
      const thirdPartyApiMode = state?.privacy?.thirdPartyApiMode ?? true;
      const preferencesController =
        state?.engine?.backgroundState?.PreferencesController;
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

    if (state?.privacy?.thirdPartyApiMode !== undefined) {
      delete state.privacy.thirdPartyApiMode;
    }

    return state;
  } catch (e) {
    return state;
  }
}
