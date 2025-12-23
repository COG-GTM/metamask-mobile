import { NetworksChainId } from '@metamask/controller-utils';

interface FrequentRpcItem {
  chainId: string;
}

interface TokensMap {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

interface State {
  engine: {
    backgroundState: {
      TokensController: {
        allTokens: TokensMap;
        [key: string]: unknown;
      };
      CollectiblesController: {
        allCollectibleContracts: TokensMap;
        allCollectibles: TokensMap;
        [key: string]: unknown;
      };
      PreferencesController: {
        frequentRpcList: FrequentRpcItem[];
      };
    };
  };
}

export default function migrate(state: State): State {
  const { allTokens } = state.engine.backgroundState.TokensController;
  const { allCollectibleContracts, allCollectibles } =
    state.engine.backgroundState.CollectiblesController;
  const { frequentRpcList } =
    state.engine.backgroundState.PreferencesController;

  const newAllCollectibleContracts: TokensMap = {};
  const newAllCollectibles: TokensMap = {};
  const newAllTokens: TokensMap = {};

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
