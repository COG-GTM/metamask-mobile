import { ChainId } from '@metamask/controller-utils';

interface NetworkEntries {
  [key: string]: unknown;
}

interface Migration04State {
  engine: {
    backgroundState: {
      TokensController: {
        allTokens: Record<string, NetworkEntries>;
        [key: string]: unknown;
      };
      CollectiblesController: {
        allCollectibleContracts: Record<string, NetworkEntries>;
        allCollectibles: Record<string, NetworkEntries>;
        [key: string]: unknown;
      };
      PreferencesController: {
        frequentRpcList: { chainId: string }[];
      };
    };
  };
}

export default function migrate(state: unknown) {
  const typedState = state as Migration04State;
  const { allTokens } = typedState.engine.backgroundState.TokensController;
  const { allCollectibleContracts, allCollectibles } =
    typedState.engine.backgroundState.CollectiblesController;
  const { frequentRpcList } =
    typedState.engine.backgroundState.PreferencesController;

  const newAllCollectibleContracts: Record<string, NetworkEntries> = {};
  const newAllCollectibles: Record<string, NetworkEntries> = {};
  const newAllTokens: Record<string, NetworkEntries> = {};

  Object.keys(allTokens).forEach((address) => {
    newAllTokens[address] = {};
    Object.keys(allTokens[address]).forEach((networkType) => {
      const networkChainId =
        ChainId[networkType as keyof typeof ChainId];
      if (networkChainId) {
        newAllTokens[address][networkChainId] =
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
      const networkChainId =
        ChainId[networkType as keyof typeof ChainId];
      if (networkChainId) {
        newAllCollectibles[address][networkChainId] =
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
      const networkChainId =
        ChainId[networkType as keyof typeof ChainId];
      if (networkChainId) {
        newAllCollectibleContracts[address][networkChainId] =
          allCollectibleContracts[address][networkType];
      } else {
        frequentRpcList.forEach(({ chainId }) => {
          newAllCollectibleContracts[address][chainId] =
            allCollectibleContracts[address][networkType];
        });
      }
    });
  });

  typedState.engine.backgroundState.TokensController = {
    ...typedState.engine.backgroundState.TokensController,
    allTokens: newAllTokens,
  };
  typedState.engine.backgroundState.CollectiblesController = {
    ...typedState.engine.backgroundState.CollectiblesController,
    allCollectibles: newAllCollectibles,
    allCollectibleContracts: newAllCollectibleContracts,
  };
  return state;
}
