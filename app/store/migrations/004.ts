import { NetworksChainId } from '@metamask/controller-utils';

export default function migrate(state: Record<string, unknown>) {
  const engineState = state.engine as Record<string, Record<string, Record<string, unknown>>>;
  const { allTokens } = engineState.backgroundState.TokensController as { allTokens: Record<string, Record<string, unknown>> };
  const { allCollectibleContracts, allCollectibles } =
    engineState.backgroundState.CollectiblesController as { allCollectibleContracts: Record<string, Record<string, unknown>>; allCollectibles: Record<string, Record<string, unknown>> };
  const { frequentRpcList } =
    engineState.backgroundState.PreferencesController as { frequentRpcList: Array<{ chainId: string }> };

  const newAllCollectibleContracts: Record<string, Record<string, unknown>> = {};
  const newAllCollectibles: Record<string, Record<string, unknown>> = {};
  const newAllTokens: Record<string, Record<string, unknown>> = {};

  Object.keys(allTokens).forEach((address) => {
    newAllTokens[address] = {};
    Object.keys(allTokens[address]).forEach((networkType) => {
      if ((NetworksChainId as Record<string, string>)[networkType]) {
        (newAllTokens[address] as Record<string, unknown>)[(NetworksChainId as Record<string, string>)[networkType]] =
          (allTokens[address] as Record<string, unknown>)[networkType];
      } else {
        frequentRpcList.forEach(({ chainId }) => {
          (newAllTokens[address] as Record<string, unknown>)[chainId] = (allTokens[address] as Record<string, unknown>)[networkType];
        });
      }
    });
  });

  Object.keys(allCollectibles).forEach((address) => {
    newAllCollectibles[address] = {};
    Object.keys(allCollectibles[address]).forEach((networkType) => {
      if ((NetworksChainId as Record<string, string>)[networkType]) {
        (newAllCollectibles[address] as Record<string, unknown>)[(NetworksChainId as Record<string, string>)[networkType]] =
          (allCollectibles[address] as Record<string, unknown>)[networkType];
      } else {
        frequentRpcList.forEach(({ chainId }) => {
          (newAllCollectibles[address] as Record<string, unknown>)[chainId] =
            (allCollectibles[address] as Record<string, unknown>)[networkType];
        });
      }
    });
  });

  Object.keys(allCollectibleContracts).forEach((address) => {
    newAllCollectibleContracts[address] = {};
    Object.keys(allCollectibleContracts[address]).forEach((networkType) => {
      if ((NetworksChainId as Record<string, string>)[networkType]) {
        (newAllCollectibleContracts[address] as Record<string, unknown>)[(NetworksChainId as Record<string, string>)[networkType]] =
          (allCollectibleContracts[address] as Record<string, unknown>)[networkType];
      } else {
        frequentRpcList.forEach(({ chainId }) => {
          (newAllCollectibleContracts[address] as Record<string, unknown>)[chainId] =
            (allCollectibleContracts[address] as Record<string, unknown>)[networkType];
        });
      }
    });
  });

  engineState.backgroundState.TokensController = {
    ...engineState.backgroundState.TokensController,
    allTokens: newAllTokens,
  };
  engineState.backgroundState.CollectiblesController = {
    ...engineState.backgroundState.CollectiblesController,
    allCollectibles: newAllCollectibles,
    allCollectibleContracts: newAllCollectibleContracts,
  };
  return state;
}
