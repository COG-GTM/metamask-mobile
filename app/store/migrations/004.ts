// @ts-expect-error `NetworksChainId` was removed from @metamask/controller-utils (pre-existing broken import)
import { NetworksChainId } from '@metamask/controller-utils';

type LegacyAssetsByNetwork = Record<string, Record<string, unknown>>;

interface MigrationState {
  engine: {
    backgroundState: {
      TokensController: {
        allTokens: LegacyAssetsByNetwork;
        [key: string]: unknown;
      };
      CollectiblesController: {
        allCollectibles: LegacyAssetsByNetwork;
        allCollectibleContracts: LegacyAssetsByNetwork;
        [key: string]: unknown;
      };
      PreferencesController: {
        frequentRpcList: { chainId: string }[];
      };
    };
  };
}

export default function migrate(untypedState: unknown) {
  const state = untypedState as MigrationState;
  const { allTokens } = state.engine.backgroundState.TokensController;
  const { allCollectibleContracts, allCollectibles } =
    state.engine.backgroundState.CollectiblesController;
  const { frequentRpcList } =
    state.engine.backgroundState.PreferencesController;

  const newAllCollectibleContracts: LegacyAssetsByNetwork = {};
  const newAllCollectibles: LegacyAssetsByNetwork = {};
  const newAllTokens: LegacyAssetsByNetwork = {};

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
