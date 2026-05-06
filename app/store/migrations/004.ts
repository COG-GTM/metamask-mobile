import { isObject, hasProperty } from '@metamask/utils';
// @ts-expect-error Frozen migration: `NetworksChainId` was removed from `@metamask/controller-utils`. Preserved as-is.
import { NetworksChainId } from '@metamask/controller-utils';

type AddressedByNetwork<T> = Record<string, Record<string, T>>;

interface FrequentRpc {
  chainId: string;
  [key: string]: unknown;
}

export default function migrate(state: unknown) {
  if (!isObject(state)) {
    return state;
  }
  if (!isObject(state.engine) || !isObject(state.engine.backgroundState)) {
    return state;
  }
  const tokensController = state.engine.backgroundState.TokensController;
  const collectiblesController =
    state.engine.backgroundState.CollectiblesController;
  const preferencesController =
    state.engine.backgroundState.PreferencesController;
  if (
    !isObject(tokensController) ||
    !isObject(collectiblesController) ||
    !isObject(preferencesController) ||
    !hasProperty(tokensController, 'allTokens') ||
    !isObject(tokensController.allTokens) ||
    !hasProperty(collectiblesController, 'allCollectibleContracts') ||
    !isObject(collectiblesController.allCollectibleContracts) ||
    !hasProperty(collectiblesController, 'allCollectibles') ||
    !isObject(collectiblesController.allCollectibles) ||
    !hasProperty(preferencesController, 'frequentRpcList') ||
    !Array.isArray(preferencesController.frequentRpcList)
  ) {
    return state;
  }

  const allTokens = tokensController.allTokens as AddressedByNetwork<unknown>;
  const allCollectibleContracts =
    collectiblesController.allCollectibleContracts as AddressedByNetwork<unknown>;
  const allCollectibles =
    collectiblesController.allCollectibles as AddressedByNetwork<unknown>;
  const frequentRpcList =
    preferencesController.frequentRpcList as FrequentRpc[];
  const networksChainId = NetworksChainId as Record<string, string>;

  const newAllCollectibleContracts: AddressedByNetwork<unknown> = {};
  const newAllCollectibles: AddressedByNetwork<unknown> = {};
  const newAllTokens: AddressedByNetwork<unknown> = {};

  Object.keys(allTokens).forEach((address) => {
    newAllTokens[address] = {};
    Object.keys(allTokens[address]).forEach((networkType) => {
      if (networksChainId[networkType]) {
        newAllTokens[address][networksChainId[networkType]] =
          allTokens[address][networkType];
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
      if (networksChainId[networkType]) {
        newAllCollectibles[address][networksChainId[networkType]] =
          allCollectibles[address][networkType];
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
      if (networksChainId[networkType]) {
        newAllCollectibleContracts[address][networksChainId[networkType]] =
          allCollectibleContracts[address][networkType];
      } else {
        frequentRpcList.forEach(({ chainId }) => {
          newAllCollectibleContracts[address][chainId] =
            allCollectibleContracts[address][networkType];
        });
      }
    });
  });

  state.engine.backgroundState.TokensController = {
    ...tokensController,
    allTokens: newAllTokens,
  };
  state.engine.backgroundState.CollectiblesController = {
    ...collectiblesController,
    allCollectibles: newAllCollectibles,
    allCollectibleContracts: newAllCollectibleContracts,
  };
  return state;
}
