import { NetworksChainId } from '@metamask/controller-utils';
import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

export default function migrate(state: unknown): Record<string, unknown> {
  if (!isObject(state)) {
    captureException(
      new Error(`Migration 004: Invalid root state: '${typeof state}'`),
    );
    return state as Record<string, unknown>;
  }

  if (
    !isObject(state.engine) ||
    !isObject((state.engine as Record<string, unknown>).backgroundState)
  ) {
    return state as Record<string, unknown>;
  }

  const engine = state.engine as Record<string, unknown>;
  const backgroundState = engine.backgroundState as Record<string, unknown>;

  if (
    !isObject(backgroundState.TokensController) ||
    !isObject(backgroundState.CollectiblesController) ||
    !isObject(backgroundState.PreferencesController)
  ) {
    return state as Record<string, unknown>;
  }

  const tokensController = backgroundState.TokensController as Record<string, unknown>;
  const collectiblesController = backgroundState.CollectiblesController as Record<string, unknown>;
  const preferencesController = backgroundState.PreferencesController as Record<string, unknown>;

  const allTokens = tokensController.allTokens as Record<string, Record<string, unknown>>;
  const allCollectibleContracts = collectiblesController.allCollectibleContracts as Record<string, Record<string, unknown>>;
  const allCollectibles = collectiblesController.allCollectibles as Record<string, Record<string, unknown>>;
  const frequentRpcList = preferencesController.frequentRpcList as Array<Record<string, unknown>>;

  const newAllCollectibleContracts: Record<string, Record<string, unknown>> = {};
  const newAllCollectibles: Record<string, Record<string, unknown>> = {};
  const newAllTokens: Record<string, Record<string, unknown>> = {};

  Object.keys(allTokens).forEach((address) => {
    newAllTokens[address] = {};
    Object.keys(allTokens[address]).forEach((networkType) => {
      if ((NetworksChainId as Record<string, string>)[networkType]) {
        newAllTokens[address][(NetworksChainId as Record<string, string>)[networkType]] =
          allTokens[address][networkType];
      } else {
        frequentRpcList.forEach(({ chainId }) => {
          newAllTokens[address][chainId as string] = allTokens[address][networkType];
        });
      }
    });
  });

  Object.keys(allCollectibles).forEach((address) => {
    newAllCollectibles[address] = {};
    Object.keys(allCollectibles[address]).forEach((networkType) => {
      if ((NetworksChainId as Record<string, string>)[networkType]) {
        newAllCollectibles[address][(NetworksChainId as Record<string, string>)[networkType]] =
          allCollectibles[address][networkType];
      } else {
        frequentRpcList.forEach(({ chainId }) => {
          newAllCollectibles[address][chainId as string] =
            allCollectibles[address][networkType];
        });
      }
    });
  });

  Object.keys(allCollectibleContracts).forEach((address) => {
    newAllCollectibleContracts[address] = {};
    Object.keys(allCollectibleContracts[address]).forEach((networkType) => {
      if ((NetworksChainId as Record<string, string>)[networkType]) {
        newAllCollectibleContracts[address][(NetworksChainId as Record<string, string>)[networkType]] =
          allCollectibleContracts[address][networkType];
      } else {
        frequentRpcList.forEach(({ chainId }) => {
          newAllCollectibleContracts[address][chainId as string] =
            allCollectibleContracts[address][networkType];
        });
      }
    });
  });

  backgroundState.TokensController = {
    ...tokensController,
    allTokens: newAllTokens,
  };
  backgroundState.CollectiblesController = {
    ...collectiblesController,
    allCollectibles: newAllCollectibles,
    allCollectibleContracts: newAllCollectibleContracts,
  };
  return state as Record<string, unknown>;
}
