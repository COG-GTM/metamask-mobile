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
    Object.values(ETHERSCAN_SUPPORTED_CHAIN_IDS).forEach(
      (hexChainId: string) => {
        const privacyState = isObject(state.privacy) ? state.privacy : undefined;
        const thirdPartyApiMode =
          (privacyState?.thirdPartyApiMode as boolean | undefined) ?? true;

        if (!isObject(state.engine)) return;
        if (!isObject(state.engine.backgroundState)) return;

        const preferencesController = state.engine.backgroundState
          .PreferencesController as Record<string, unknown> | undefined;

        if (
          preferencesController &&
          isObject(preferencesController.showIncomingTransactions)
        ) {
          preferencesController.showIncomingTransactions = {
            ...(preferencesController.showIncomingTransactions as Record<
              string,
              boolean
            >),
            [hexChainId]: thirdPartyApiMode,
          };
        } else if (preferencesController) {
          preferencesController.showIncomingTransactions = {
            [hexChainId]: thirdPartyApiMode,
          };
        }
      },
    );

    if (isObject(state.privacy) && state.privacy.thirdPartyApiMode !== undefined) {
      delete state.privacy.thirdPartyApiMode;
    }

    return state;
  } catch (e) {
    return state;
  }
}
