import { ETHERSCAN_SUPPORTED_CHAIN_IDS } from '@metamask/preferences-controller';

export default function migrate(state: unknown) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = state as Record<string, any>;
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

    return s;
  } catch (e) {
    return s;
  }
}
