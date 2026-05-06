import * as ControllerUtils from '@metamask/controller-utils';

// `NetworksChainId` was previously exported from `@metamask/controller-utils`
// but has been removed. Cast through unknown to preserve the original
// (broken) runtime behavior without altering it.
const NetworksChainId = (
  ControllerUtils as unknown as {
    NetworksChainId?: Record<string, string>;
  }
).NetworksChainId as Record<string, string>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyMap = Record<string, any>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function migrate(state: any) {
  const { allTokens } = state.engine.backgroundState.TokensController;
  const { allCollectibleContracts, allCollectibles } =
    state.engine.backgroundState.CollectiblesController;
  const { frequentRpcList } =
    state.engine.backgroundState.PreferencesController;

  const newAllCollectibleContracts: AnyMap = {};
  const newAllCollectibles: AnyMap = {};
  const newAllTokens: AnyMap = {};

  Object.keys(allTokens).forEach((address) => {
    newAllTokens[address] = {};
    Object.keys(allTokens[address]).forEach((networkType) => {
      if (NetworksChainId[networkType]) {
        newAllTokens[address][NetworksChainId[networkType]] =
          allTokens[address][networkType];
      } else {
        frequentRpcList.forEach(({ chainId }: { chainId: string }) => {
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
        frequentRpcList.forEach(({ chainId }: { chainId: string }) => {
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
        frequentRpcList.forEach(({ chainId }: { chainId: string }) => {
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
