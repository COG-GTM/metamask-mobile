import { NetworksChainId } from '@metamask/controller-utils';

type AssetsByNetwork = Record<string, Record<string, unknown>>;

interface Migration004State {
  engine: {
    backgroundState: {
      TokensController: {
        allTokens: AssetsByNetwork;
        [key: string]: unknown;
      };
      CollectiblesController: {
        allCollectibleContracts: AssetsByNetwork;
        allCollectibles: AssetsByNetwork;
        [key: string]: unknown;
      };
      PreferencesController: {
        frequentRpcList: { chainId: string }[];
      };
    };
  };
}

export default function migrate(state: unknown) {
  const migratedState = state as Migration004State;
  const { allTokens } = migratedState.engine.backgroundState.TokensController;
  const { allCollectibleContracts, allCollectibles } =
    migratedState.engine.backgroundState.CollectiblesController;
  const { frequentRpcList } =
    migratedState.engine.backgroundState.PreferencesController;

  const newAllCollectibleContracts: AssetsByNetwork = {};
  const newAllCollectibles: AssetsByNetwork = {};
  const newAllTokens: AssetsByNetwork = {};

  Object.keys(allTokens).forEach((address) => {
    newAllTokens[address] = {};
    Object.keys(allTokens[address]).forEach((networkType) => {
      if (NetworksChainId[networkType]) {
        newAllTokens[address][NetworksChainId[networkType]] =
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
      if (NetworksChainId[networkType]) {
        newAllCollectibles[address][NetworksChainId[networkType]] =
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
      if (NetworksChainId[networkType]) {
        newAllCollectibleContracts[address][NetworksChainId[networkType]] =
          allCollectibleContracts[address][networkType];
      } else {
        frequentRpcList.forEach(({ chainId }) => {
          newAllCollectibleContracts[address][chainId] =
            allCollectibleContracts[address][networkType];
        });
      }
    });
  });

  migratedState.engine.backgroundState.TokensController = {
    ...migratedState.engine.backgroundState.TokensController,
    allTokens: newAllTokens,
  };
  migratedState.engine.backgroundState.CollectiblesController = {
    ...migratedState.engine.backgroundState.CollectiblesController,
    allCollectibles: newAllCollectibles,
    allCollectibleContracts: newAllCollectibleContracts,
  };
  return migratedState;
}
