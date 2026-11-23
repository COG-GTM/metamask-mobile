// @ts-expect-error -- NetworksChainId was removed from @metamask/controller-utils; import kept as-is to preserve historical behavior
import { NetworksChainId } from '@metamask/controller-utils';

type ByNetwork = Record<string, unknown>;
type ByAddress = Record<string, ByNetwork>;

interface MigrationState {
  engine: {
    backgroundState: {
      TokensController: { allTokens: ByAddress; [key: string]: unknown };
      CollectiblesController: {
        allCollectibles: ByAddress;
        allCollectibleContracts: ByAddress;
        [key: string]: unknown;
      };
      PreferencesController: { frequentRpcList: { chainId: string }[] };
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

  const newAllCollectibleContracts: ByAddress = {};
  const newAllCollectibles: ByAddress = {};
  const newAllTokens: ByAddress = {};

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
