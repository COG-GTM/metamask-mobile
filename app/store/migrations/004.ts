import { isObject } from '@metamask/utils';
import { NETWORKS_CHAIN_ID } from './migration-data/networks-chain-id';
import { ensureValidState } from './util';

type AssetsByChain = Record<string, Record<string, unknown>>;

/**
 * Key assets by chain ID rather than by network type, using the chain IDs of
 * the built-in networks and of every configured custom network.
 */
function migrateAssetsByAddress(
  assetsByAddress: Record<string, unknown>,
  customChainIds: string[],
): AssetsByChain {
  const migratedAssets: AssetsByChain = {};

  for (const [address, assetsByNetwork] of Object.entries(assetsByAddress)) {
    migratedAssets[address] = {};

    if (!isObject(assetsByNetwork)) {
      continue;
    }

    for (const [networkType, assets] of Object.entries(assetsByNetwork)) {
      const builtInChainId =
        NETWORKS_CHAIN_ID[networkType as keyof typeof NETWORKS_CHAIN_ID];
      if (builtInChainId) {
        migratedAssets[address][builtInChainId] = assets;
      } else {
        for (const chainId of customChainIds) {
          migratedAssets[address][chainId] = assets;
        }
      }
    }
  }

  return migratedAssets;
}

export default function migrate(state: unknown) {
  if (!ensureValidState(state, 4)) {
    return state;
  }

  const tokensControllerState = state.engine.backgroundState.TokensController;
  const collectiblesControllerState =
    state.engine.backgroundState.CollectiblesController;
  const preferencesControllerState =
    state.engine.backgroundState.PreferencesController;

  if (
    !isObject(tokensControllerState) ||
    !isObject(tokensControllerState.allTokens) ||
    !isObject(collectiblesControllerState) ||
    !isObject(collectiblesControllerState.allCollectibles) ||
    !isObject(collectiblesControllerState.allCollectibleContracts) ||
    !isObject(preferencesControllerState) ||
    !Array.isArray(preferencesControllerState.frequentRpcList)
  ) {
    return state;
  }

  const customChainIds: string[] = [];
  for (const networkConfiguration of preferencesControllerState.frequentRpcList) {
    if (isObject(networkConfiguration)) {
      customChainIds.push(String(networkConfiguration.chainId));
    }
  }

  state.engine.backgroundState.TokensController = {
    ...tokensControllerState,
    allTokens: migrateAssetsByAddress(
      tokensControllerState.allTokens,
      customChainIds,
    ),
  };
  state.engine.backgroundState.CollectiblesController = {
    ...collectiblesControllerState,
    allCollectibles: migrateAssetsByAddress(
      collectiblesControllerState.allCollectibles,
      customChainIds,
    ),
    allCollectibleContracts: migrateAssetsByAddress(
      collectiblesControllerState.allCollectibleContracts,
      customChainIds,
    ),
  };
  return state;
}
