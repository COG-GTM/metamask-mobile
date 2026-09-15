import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';
import { ensureValidState } from './util';
import { getLegacyChainIdForNetworkType } from './002';

type AssetsByAddressAndNetwork = Record<string, Record<string, unknown>>;

const getFrequentRpcChainIds = (frequentRpcList: unknown[]): string[] =>
  frequentRpcList.reduce<string[]>((chainIds, rpc) => {
    if (isObject(rpc) && typeof rpc.chainId === 'string') {
      chainIds.push(rpc.chainId);
    }
    return chainIds;
  }, []);

/**
 * Re-keys a `{ [address]: { [networkType]: assets } }` map to
 * `{ [address]: { [chainId]: assets } }`.
 */
const migrateAssetsByNetworkTypeToChainId = (
  assetsByAddress: unknown,
  frequentRpcChainIds: string[],
): AssetsByAddressAndNetwork => {
  const migrated: AssetsByAddressAndNetwork = {};
  if (!isObject(assetsByAddress)) {
    return migrated;
  }
  Object.keys(assetsByAddress).forEach((address) => {
    migrated[address] = {};
    const assetsByNetworkType = assetsByAddress[address];
    if (!isObject(assetsByNetworkType)) {
      return;
    }
    Object.keys(assetsByNetworkType).forEach((networkType) => {
      const chainId = getLegacyChainIdForNetworkType(networkType);
      if (chainId) {
        migrated[address][chainId] = assetsByNetworkType[networkType];
      } else {
        frequentRpcChainIds.forEach((rpcChainId) => {
          migrated[address][rpcChainId] = assetsByNetworkType[networkType];
        });
      }
    });
  });
  return migrated;
};

export default function migrate(state: unknown) {
  if (!ensureValidState(state, 4)) {
    return state;
  }

  const { TokensController, CollectiblesController, PreferencesController } =
    state.engine.backgroundState;

  if (!isObject(TokensController)) {
    captureException(
      new Error(
        `Migration 4: Invalid TokensController state: '${typeof TokensController}'`,
      ),
    );
    return state;
  }
  if (!isObject(CollectiblesController)) {
    captureException(
      new Error(
        `Migration 4: Invalid CollectiblesController state: '${typeof CollectiblesController}'`,
      ),
    );
    return state;
  }
  if (
    !isObject(PreferencesController) ||
    !Array.isArray(PreferencesController.frequentRpcList)
  ) {
    captureException(
      new Error(
        `Migration 4: Invalid PreferencesController state: '${typeof PreferencesController}'`,
      ),
    );
    return state;
  }

  const frequentRpcChainIds = getFrequentRpcChainIds(
    PreferencesController.frequentRpcList,
  );

  state.engine.backgroundState.TokensController = {
    ...TokensController,
    allTokens: migrateAssetsByNetworkTypeToChainId(
      TokensController.allTokens,
      frequentRpcChainIds,
    ),
  };
  state.engine.backgroundState.CollectiblesController = {
    ...CollectiblesController,
    allCollectibles: migrateAssetsByNetworkTypeToChainId(
      CollectiblesController.allCollectibles,
      frequentRpcChainIds,
    ),
    allCollectibleContracts: migrateAssetsByNetworkTypeToChainId(
      CollectiblesController.allCollectibleContracts,
      frequentRpcChainIds,
    ),
  };
  return state;
}
