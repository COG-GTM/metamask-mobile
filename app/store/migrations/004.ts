import { NetworksChainId } from '@metamask/controller-utils';

export default function migrate(state: unknown): unknown {
  const s = state as {
    engine: {
      backgroundState: {
        TokensController: Record<string, unknown>;
        CollectiblesController: Record<string, unknown>;
        PreferencesController: { frequentRpcList: { chainId: string }[] };
      };
    };
  };
  const { allTokens } = s.engine.backgroundState.TokensController as Record<string, Record<string, Record<string, unknown>>>;
  const { allCollectibleContracts, allCollectibles } =
    s.engine.backgroundState.CollectiblesController as Record<string, Record<string, Record<string, unknown>>>;
  const { frequentRpcList } =
    s.engine.backgroundState.PreferencesController;

  const newAllCollectibleContracts: Record<string, Record<string, unknown>> = {};
  const newAllCollectibles: Record<string, Record<string, unknown>> = {};
  const newAllTokens: Record<string, Record<string, unknown>> = {};

  Object.keys(allTokens).forEach((address) => {
    newAllTokens[address] = {};
    Object.keys(allTokens[address]).forEach((networkType) => {
      if (NetworksChainId[networkType as keyof typeof NetworksChainId]) {
        newAllTokens[address][NetworksChainId[networkType as keyof typeof NetworksChainId]] =
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
      if (NetworksChainId[networkType as keyof typeof NetworksChainId]) {
        newAllCollectibles[address][NetworksChainId[networkType as keyof typeof NetworksChainId]] =
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
      if (NetworksChainId[networkType as keyof typeof NetworksChainId]) {
        newAllCollectibleContracts[address][NetworksChainId[networkType as keyof typeof NetworksChainId]] =
          allCollectibleContracts[address][networkType];
      } else {
        frequentRpcList.forEach(({ chainId }) => {
          newAllCollectibleContracts[address][chainId] =
            allCollectibleContracts[address][networkType];
        });
      }
    });
  });

  s.engine.backgroundState.TokensController = {
    ...s.engine.backgroundState.TokensController,
    allTokens: newAllTokens,
  };
  s.engine.backgroundState.CollectiblesController = {
    ...s.engine.backgroundState.CollectiblesController,
    allCollectibles: newAllCollectibles,
    allCollectibleContracts: newAllCollectibleContracts,
  };
  return state;
}
