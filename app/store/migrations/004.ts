// @ts-expect-error This export no longer exists in the current version; migration retained for historical persisted state.
import { NetworksChainId } from '@metamask/controller-utils';

type NetworkData = Record<string, unknown>;
type NetworkDataByAddress = Record<string, NetworkData>;

interface MigrationState {
  engine: {
    backgroundState: {
      TokensController: {
        allTokens: NetworkDataByAddress;
      };
      CollectiblesController: {
        allCollectibleContracts: NetworkDataByAddress;
        allCollectibles: NetworkDataByAddress;
      };
      PreferencesController: {
        frequentRpcList: { chainId: string }[];
      };
    };
  };
}

export default function migrate(state: unknown) {
  const typedState = state as MigrationState;
  const { allTokens } = typedState.engine.backgroundState.TokensController;
  const { allCollectibleContracts, allCollectibles } =
    typedState.engine.backgroundState.CollectiblesController;
  const { frequentRpcList } =
    typedState.engine.backgroundState.PreferencesController;

  const newAllCollectibleContracts: NetworkDataByAddress = {};
  const newAllCollectibles: NetworkDataByAddress = {};
  const newAllTokens: NetworkDataByAddress = {};

  Object.keys(allTokens).forEach((address) => {
    newAllTokens[address] = {};
    Object.keys(allTokens[address]).forEach((networkType) => {
      if (NetworksChainId[networkType as keyof typeof NetworksChainId]) {
        newAllTokens[address][
          NetworksChainId[networkType as keyof typeof NetworksChainId]
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
      if (NetworksChainId[networkType as keyof typeof NetworksChainId]) {
        newAllCollectibles[address][
          NetworksChainId[networkType as keyof typeof NetworksChainId]
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
      if (NetworksChainId[networkType as keyof typeof NetworksChainId]) {
        newAllCollectibleContracts[address][
          NetworksChainId[networkType as keyof typeof NetworksChainId]
        ] = allCollectibleContracts[address][networkType];
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
  return typedState;
}
