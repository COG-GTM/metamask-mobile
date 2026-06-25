// @ts-expect-error NetworksChainId was removed from @metamask/controller-utils; retained for this legacy migration where it resolves to undefined at runtime.
import { NetworksChainId } from '@metamask/controller-utils';

type AllByNetwork = Record<string, Record<string, unknown>>;

export default function migrate(state: unknown): Record<string, unknown> {
  const typedState = state as {
    engine: {
      backgroundState: {
        TokensController: { allTokens: AllByNetwork };
        CollectiblesController: {
          allCollectibleContracts: AllByNetwork;
          allCollectibles: AllByNetwork;
        };
        PreferencesController: {
          frequentRpcList: { chainId: string }[];
        };
      };
    };
  };
  const { allTokens } = typedState.engine.backgroundState.TokensController;
  const { allCollectibleContracts, allCollectibles } =
    typedState.engine.backgroundState.CollectiblesController;
  const { frequentRpcList } =
    typedState.engine.backgroundState.PreferencesController;

  const newAllCollectibleContracts: AllByNetwork = {};
  const newAllCollectibles: AllByNetwork = {};
  const newAllTokens: AllByNetwork = {};

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
