import { ETHERSCAN_SUPPORTED_CHAIN_IDS } from '@metamask/preferences-controller';
import { isObject } from '@metamask/utils';

export default function migrate(state: unknown): Record<string, unknown> {
  if (!isObject(state)) {
    return state as Record<string, unknown>;
  }

  try {
    const stateRecord = state as Record<string, unknown>;

    if (
      !isObject(stateRecord.engine) ||
      !isObject((stateRecord.engine as Record<string, unknown>).backgroundState)
    ) {
      return stateRecord;
    }

    const engine = stateRecord.engine as Record<string, unknown>;
    const backgroundState = engine.backgroundState as Record<string, unknown>;
    const privacy = stateRecord.privacy as Record<string, unknown> | undefined;

    Object.values(ETHERSCAN_SUPPORTED_CHAIN_IDS).forEach((hexChainId) => {
      const thirdPartyApiMode = privacy?.thirdPartyApiMode ?? true;
      if (
        isObject(backgroundState.PreferencesController) &&
        (backgroundState.PreferencesController as Record<string, unknown>).showIncomingTransactions
      ) {
        (backgroundState.PreferencesController as Record<string, unknown>).showIncomingTransactions =
          {
            ...((backgroundState.PreferencesController as Record<string, unknown>)
              .showIncomingTransactions as Record<string, unknown>),
            [hexChainId]: thirdPartyApiMode,
          };
      } else if (isObject(backgroundState.PreferencesController)) {
        (backgroundState.PreferencesController as Record<string, unknown>).showIncomingTransactions =
          { [hexChainId]: thirdPartyApiMode };
      }
    });

    if (privacy?.thirdPartyApiMode !== undefined) {
      delete privacy.thirdPartyApiMode;
    }

    return stateRecord;
  } catch (e) {
    return state as Record<string, unknown>;
  }
}
