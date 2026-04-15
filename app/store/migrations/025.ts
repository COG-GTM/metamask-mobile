import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';
import { ETHERSCAN_SUPPORTED_CHAIN_IDS } from '@metamask/preferences-controller';

export default function migrate(state: unknown) {
  if (!isObject(state)) {
    captureException(
      new Error(`Migration 25: Invalid root state: '${typeof state}'`),
    );
    return state;
  }

  try {
    Object.values(ETHERSCAN_SUPPORTED_CHAIN_IDS).forEach((hexChainId) => {
      const privacy = state.privacy as Record<string, unknown> | undefined;
      const thirdPartyApiMode = privacy?.thirdPartyApiMode ?? true;
      const engine = state.engine as Record<string, unknown> | undefined;
      const backgroundState = engine?.backgroundState as
        | Record<string, unknown>
        | undefined;
      const preferencesController = backgroundState?.PreferencesController as
        | Record<string, unknown>
        | undefined;

      if (preferencesController?.showIncomingTransactions) {
        preferencesController.showIncomingTransactions = {
          ...(preferencesController.showIncomingTransactions as Record<
            string,
            unknown
          >),
          [hexChainId]: thirdPartyApiMode,
        };
      } else if (preferencesController) {
        preferencesController.showIncomingTransactions = {
          [hexChainId]: thirdPartyApiMode,
        };
      }
    });

    const privacy = state.privacy as Record<string, unknown> | undefined;
    if (privacy?.thirdPartyApiMode !== undefined) {
      delete privacy.thirdPartyApiMode;
    }

    return state;
  } catch (e) {
    return state;
  }
}
