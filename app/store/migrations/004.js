// Frozen copy of `NetworksChainId` from @metamask/controllers v7, which this
// migration was written against. The constant no longer exists in
// @metamask/controller-utils, and its values must not follow later changes.
const LEGACY_NETWORKS_CHAIN_ID = {
  mainnet: '1',
  kovan: '42',
  rinkeby: '4',
  goerli: '5',
  ropsten: '3',
};

const getLegacyChainId = (networkType) =>
  Object.prototype.hasOwnProperty.call(LEGACY_NETWORKS_CHAIN_ID, networkType)
    ? LEGACY_NETWORKS_CHAIN_ID[networkType]
    : undefined;

const rekeyByChainId = (assetsByAddress, frequentRpcList) => {
  const migrated = {};
  Object.keys(assetsByAddress).forEach((address) => {
    migrated[address] = {};
    Object.keys(assetsByAddress[address] || {}).forEach((networkType) => {
      const assets = assetsByAddress[address][networkType];
      const chainId = getLegacyChainId(networkType);
      if (chainId) {
        migrated[address][chainId] = assets;
      } else {
        frequentRpcList.forEach(({ chainId: rpcChainId } = {}) => {
          if (rpcChainId) {
            migrated[address][rpcChainId] = assets;
          }
        });
      }
    });
  });
  return migrated;
};

const rekeyMaps = (controllerState, mapNames, frequentRpcList) => {
  const migrated = { ...controllerState };
  mapNames.forEach((mapName) => {
    if (controllerState[mapName]) {
      migrated[mapName] = rekeyByChainId(
        controllerState[mapName],
        frequentRpcList,
      );
    }
  });
  return migrated;
};

export default function migrate(state) {
  const backgroundState = state?.engine?.backgroundState;
  if (!backgroundState) {
    return state;
  }

  const frequentRpcList = Array.isArray(
    backgroundState.PreferencesController?.frequentRpcList,
  )
    ? backgroundState.PreferencesController.frequentRpcList
    : [];

  // Pre-v4 state keeps assets in AssetsController; migration 005 splits it.
  if (backgroundState.AssetsController) {
    backgroundState.AssetsController = rekeyMaps(
      backgroundState.AssetsController,
      ['allTokens', 'allCollectibles', 'allCollectibleContracts'],
      frequentRpcList,
    );
    return state;
  }

  if (backgroundState.TokensController) {
    backgroundState.TokensController = rekeyMaps(
      backgroundState.TokensController,
      ['allTokens'],
      frequentRpcList,
    );
  }
  if (backgroundState.CollectiblesController) {
    backgroundState.CollectiblesController = rekeyMaps(
      backgroundState.CollectiblesController,
      ['allCollectibles', 'allCollectibleContracts'],
      frequentRpcList,
    );
  }
  return state;
}
