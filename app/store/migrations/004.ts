// `NetworksChainId` was removed from `@metamask/controller-utils` after this
// migration was written. The import is left untouched so this historical
// migration keeps its current runtime behaviour.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error - `NetworksChainId` is no longer exported by @metamask/controller-utils
import { NetworksChainId } from '@metamask/controller-utils';

type ByNetwork = Record<string, unknown>;
type ByAddress = Record<string, ByNetwork>;

interface MigrationState {
  engine: {
    backgroundState: {
      TokensController: {
        allTokens: ByAddress;
      };
      CollectiblesController: {
        allCollectibleContracts: ByAddress;
        allCollectibles: ByAddress;
      };
      PreferencesController: {
        frequentRpcList: { chainId: string }[];
      };
    };
  };
}

export default function migrate(state: unknown) {
  const migrationState = state as MigrationState;
  const { allTokens } = migrationState.engine.backgroundState.TokensController;
  const { allCollectibleContracts, allCollectibles } =
    migrationState.engine.backgroundState.CollectiblesController;
  const { frequentRpcList } =
    migrationState.engine.backgroundState.PreferencesController;

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

  migrationState.engine.backgroundState.TokensController = {
    ...migrationState.engine.backgroundState.TokensController,
    allTokens: newAllTokens,
  };
  migrationState.engine.backgroundState.CollectiblesController = {
    ...migrationState.engine.backgroundState.CollectiblesController,
    allCollectibles: newAllCollectibles,
    allCollectibleContracts: newAllCollectibleContracts,
  };
  return state;
}
