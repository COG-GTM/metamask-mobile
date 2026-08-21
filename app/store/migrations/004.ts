// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error `NetworksChainId` was removed from `@metamask/controller-utils`.
// The import is preserved as-is so this migration keeps its current runtime behaviour.
import { NetworksChainId } from '@metamask/controller-utils';

/** Assets keyed by account address and then by network type or chain ID. */
type AssetsByAccount = Record<string, Record<string, unknown>>;

/**
 * Shape of the persisted state this migration expects. It predates the runtime
 * validation used by later migrations, so the shape is asserted rather than
 * narrowed in order to keep the original behaviour.
 */
interface MigrationState {
  engine: {
    backgroundState: {
      TokensController: {
        allTokens: AssetsByAccount;
      };
      CollectiblesController: {
        allCollectibleContracts: AssetsByAccount;
        allCollectibles: AssetsByAccount;
      };
      PreferencesController: {
        frequentRpcList: { chainId: string }[];
      };
    };
  };
}

export default function migrate(state: unknown): Record<string, unknown> {
  const backgroundState = (state as MigrationState).engine.backgroundState;
  const { allTokens } = backgroundState.TokensController;
  const { allCollectibleContracts, allCollectibles } =
    backgroundState.CollectiblesController;
  const { frequentRpcList } = backgroundState.PreferencesController;

  const newAllCollectibleContracts: AssetsByAccount = {};
  const newAllCollectibles: AssetsByAccount = {};
  const newAllTokens: AssetsByAccount = {};

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

  backgroundState.TokensController = {
    ...backgroundState.TokensController,
    allTokens: newAllTokens,
  };
  backgroundState.CollectiblesController = {
    ...backgroundState.CollectiblesController,
    allCollectibles: newAllCollectibles,
    allCollectibleContracts: newAllCollectibleContracts,
  };
  return state as Record<string, unknown>;
}
