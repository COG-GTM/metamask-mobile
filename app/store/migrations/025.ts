import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';
import { ETHERSCAN_SUPPORTED_CHAIN_IDS } from '@metamask/preferences-controller';

export default function migrate(state: unknown) {
  if (!isObject(state)) {
    captureException(
      new Error(`Migration 25: Invalid root state: root state is not an object`),
    );
    return state;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const typedState = state as Record<string, any>;
  try {
    Object.values(ETHERSCAN_SUPPORTED_CHAIN_IDS).forEach((hexChainId: string) => {
      const thirdPartyApiMode = typedState?.privacy?.thirdPartyApiMode ?? true;
      if (
        typedState?.engine?.backgroundState?.PreferencesController
          ?.showIncomingTransactions
      ) {
        typedState.engine.backgroundState.PreferencesController.showIncomingTransactions =
          {
            ...typedState.engine.backgroundState.PreferencesController
              .showIncomingTransactions,
            [hexChainId]: thirdPartyApiMode,
          };
      } else if (typedState?.engine?.backgroundState?.PreferencesController) {
        typedState.engine.backgroundState.PreferencesController.showIncomingTransactions =
          { [hexChainId]: thirdPartyApiMode };
      }
    });

    if (typedState?.privacy?.thirdPartyApiMode !== undefined) {
      delete typedState.privacy.thirdPartyApiMode;
    }

    return typedState;
  } catch (e) {
    return typedState;
  }
}
