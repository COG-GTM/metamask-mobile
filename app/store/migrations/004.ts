import { NetworksChainId } from '@metamask/controller-utils';
import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

export default function migrate(state: unknown) {
  if (!isObject(state)) {
    captureException(
      new Error(`Migration 4: Invalid root state: '${typeof state}'`),
    );
    return state;
  }
  if (!isObject(state.engine)) {
    captureException(
      new Error(`Migration 4: Invalid engine state: '${typeof state.engine}'`),
    );
    return state;
  }
  if (!isObject(state.engine.backgroundState)) {
    captureException(
      new Error(
        `Migration 4: Invalid engine backgroundState: '${typeof state.engine
          .backgroundState}'`,
      ),
    );
    return state;
  }
  if (
    !isObject(state.engine.backgroundState.TokensController) ||
    !isObject(state.engine.backgroundState.CollectiblesController) ||
    !isObject(state.engine.backgroundState.PreferencesController)
  ) {
    captureException(
      new Error(`Migration 4: Invalid controller state`),
    );
    return state;
  }

  const { allTokens } = state.engine.backgroundState.TokensController as {
    allTokens: Record<string, Record<string, unknown[]>>;
  };
  const { allCollectibleContracts, allCollectibles } = state.engine
    .backgroundState.CollectiblesController as {
    allCollectibleContracts: Record<string, Record<string, unknown[]>>;
    allCollectibles: Record<string, Record<string, unknown[]>>;
  };
  const { frequentRpcList } = state.engine.backgroundState
    .PreferencesController as {
    frequentRpcList: Array<{ chainId: string }>;
  };

  const newAllCollectibleContracts: Record<
    string,
    Record<string, unknown[]>
  > = {};
  const newAllCollectibles: Record<string, Record<string, unknown[]>> = {};
  const newAllTokens: Record<string, Record<string, unknown[]>> = {};

  Object.keys(allTokens).forEach((address) => {
    newAllTokens[address] = {};
    Object.keys(allTokens[address]).forEach((networkType) => {
      if ((NetworksChainId as Record<string, string>)[networkType]) {
        newAllTokens[address][
          (NetworksChainId as Record<string, string>)[networkType]
        ] = allTokens[address][networkType];
      } else {
        frequentRpcList.forEach(({ chainId }) => {
          newAllTokens[address][chainId] = allTokens[address][networkType];
        });
      }
    });
  });

  Object.keys(allCollectibles).forEach((address) => {
    newAllCollectibles[address] = {};
    Object.keys(allCollectibles[address]).forEach((networkType) => {
      if ((NetworksChainId as Record<string, string>)[networkType]) {
        newAllCollectibles[address][
          (NetworksChainId as Record<string, string>)[networkType]
        ] = allCollectibles[address][networkType];
      } else {
        frequentRpcList.forEach(({ chainId }) => {
          newAllCollectibles[address][chainId] =
            allCollectibles[address][networkType];
        });
      }
    });
  });

  Object.keys(allCollectibleContracts).forEach((address) => {
    newAllCollectibleContracts[address] = {};
    Object.keys(allCollectibleContracts[address]).forEach((networkType) => {
      if ((NetworksChainId as Record<string, string>)[networkType]) {
        newAllCollectibleContracts[address][
          (NetworksChainId as Record<string, string>)[networkType]
        ] = allCollectibleContracts[address][networkType];
      } else {
        frequentRpcList.forEach(({ chainId }) => {
          newAllCollectibleContracts[address][chainId] =
            allCollectibleContracts[address][networkType];
        });
      }
    });
  });

  state.engine.backgroundState.TokensController = {
    ...state.engine.backgroundState.TokensController,
    allTokens: newAllTokens,
  };
  state.engine.backgroundState.CollectiblesController = {
    ...state.engine.backgroundState.CollectiblesController,
    allCollectibles: newAllCollectibles,
    allCollectibleContracts: newAllCollectibleContracts,
  };
  return state;
}
