// @ts-expect-error `NetworksChainId` was removed from @metamask/controller-utils; legacy migration kept as-is
import { NetworksChainId } from '@metamask/controller-utils';

type ByAddressByNetwork = Record<string, Record<string, unknown>>;

interface LegacyState {
  engine: {
    backgroundState: {
      TokensController: {
        allTokens: ByAddressByNetwork;
        [key: string]: unknown;
      };
      CollectiblesController: {
        allCollectibleContracts: ByAddressByNetwork;
        allCollectibles: ByAddressByNetwork;
        [key: string]: unknown;
      };
      PreferencesController: {
        frequentRpcList: { chainId: string; [key: string]: unknown }[];
      };
    };
  };
}

const networksChainId = NetworksChainId as Record<string, string | undefined>;

export default function migrate(stateArg: unknown) {
  const state = stateArg as LegacyState;
  const { allTokens } = state.engine.backgroundState.TokensController;
  const { allCollectibleContracts, allCollectibles } =
    state.engine.backgroundState.CollectiblesController;
  const { frequentRpcList } =
    state.engine.backgroundState.PreferencesController;

  const newAllCollectibleContracts: ByAddressByNetwork = {};
  const newAllCollectibles: ByAddressByNetwork = {};
  const newAllTokens: ByAddressByNetwork = {};

  Object.keys(allTokens).forEach((address) => {
    newAllTokens[address] = {};
    Object.keys(allTokens[address]).forEach((networkType) => {
      const chainIdForNetwork = networksChainId[networkType];
      if (chainIdForNetwork) {
        newAllTokens[address][chainIdForNetwork] =
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
      const chainIdForNetwork = networksChainId[networkType];
      if (chainIdForNetwork) {
        newAllCollectibles[address][chainIdForNetwork] =
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
      const chainIdForNetwork = networksChainId[networkType];
      if (chainIdForNetwork) {
        newAllCollectibleContracts[address][chainIdForNetwork] =
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
