// @ts-expect-error - NetworksChainId exists at runtime on controller-utils but is omitted from its type definitions
import { NetworksChainId } from '@metamask/controller-utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function migrate(state: any) {
  const { allTokens } = state.engine.backgroundState.TokensController;
  const { allCollectibleContracts, allCollectibles } =
    state.engine.backgroundState.CollectiblesController;
  const { frequentRpcList } =
    state.engine.backgroundState.PreferencesController;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const newAllCollectibleContracts: Record<string, any> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const newAllCollectibles: Record<string, any> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const newAllTokens: Record<string, any> = {};

  Object.keys(allTokens).forEach((address) => {
    newAllTokens[address] = {};
    Object.keys(allTokens[address]).forEach((networkType) => {
      if (NetworksChainId[networkType]) {
        newAllTokens[address][NetworksChainId[networkType]] =
          allTokens[address][networkType];
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        frequentRpcList.forEach(({ chainId }: any) => {
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        frequentRpcList.forEach(({ chainId }: any) => {
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        frequentRpcList.forEach(({ chainId }: any) => {
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
