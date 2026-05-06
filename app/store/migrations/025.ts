import { ETHERSCAN_SUPPORTED_CHAIN_IDS } from '@metamask/preferences-controller';
import { isObject } from '@metamask/utils';

interface PreferencesControllerState {
  showIncomingTransactions?: Record<string, boolean>;
  [key: string]: unknown;
}

interface PrivacyState {
  thirdPartyApiMode?: boolean;
  [key: string]: unknown;
}

export default function migrate(state: unknown) {
  if (!isObject(state)) return state;
  try {
    Object.values(ETHERSCAN_SUPPORTED_CHAIN_IDS).forEach((hexChainId) => {
      const privacy = state.privacy as PrivacyState | undefined;
      const thirdPartyApiMode = privacy?.thirdPartyApiMode ?? true;
      const engine = state.engine as
        | { backgroundState?: Record<string, unknown> }
        | undefined;
      const preferencesController = engine?.backgroundState
        ?.PreferencesController as PreferencesControllerState | undefined;
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

    const privacy = state.privacy as PrivacyState | undefined;
    if (privacy?.thirdPartyApiMode !== undefined) {
      delete privacy.thirdPartyApiMode;
    }

    return state;
  } catch (e) {
    return state;
  }
}
