// `NetworksChainId` was removed from @metamask/controller-utils; at runtime this
// is `undefined`, preserving this dormant migration's original behavior.
const NetworksChainId = undefined as unknown as Record<string, string>;

type NetworkBuckets = Record<string, unknown>;

export default function migrate(state: unknown): Record<string, unknown> {
  // Expected shape: allTokens/allCollectibles/allCollectibleContracts are maps
  // keyed by account address, then by network type; frequentRpcList is an array
  // of objects with a `chainId`.
  const { backgroundState } = (
    state as {
      engine: { backgroundState: Record<string, Record<string, unknown>> };
    }
  ).engine;
  const { allTokens } = backgroundState.TokensController as {
    allTokens: Record<string, NetworkBuckets>;
  };
  const { allCollectibleContracts, allCollectibles } =
    backgroundState.CollectiblesController as {
      allCollectibleContracts: Record<string, NetworkBuckets>;
      allCollectibles: Record<string, NetworkBuckets>;
    };
  const { frequentRpcList } = backgroundState.PreferencesController as {
    frequentRpcList: { chainId: string }[];
  };

  const newAllCollectibleContracts: Record<string, NetworkBuckets> = {};
  const newAllCollectibles: Record<string, NetworkBuckets> = {};
  const newAllTokens: Record<string, NetworkBuckets> = {};

  Object.keys(allTokens).forEach((address) => {
    newAllTokens[address] = {};
    Object.keys(allTokens[address]).forEach((networkType) => {
      const networkChainId = NetworksChainId[networkType];
      if (networkChainId) {
        newAllTokens[address][networkChainId] =
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
      const networkChainId = NetworksChainId[networkType];
      if (networkChainId) {
        newAllCollectibles[address][networkChainId] =
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
      const networkChainId = NetworksChainId[networkType];
      if (networkChainId) {
        newAllCollectibleContracts[address][networkChainId] =
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
