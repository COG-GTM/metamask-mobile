type TokensByNetwork = Record<string, Record<string, unknown>>;

// Historical NetworksChainId mapping (decimal strings) previously exported
// from @metamask/controller-utils. Inlined here to preserve this legacy
// migration's intended behavior.
const LEGACY_NETWORKS_CHAIN_ID: Record<string, string> = {
  mainnet: '1',
  goerli: '5',
  sepolia: '11155111',
  rpc: '',
};

export default function migrate(state: unknown): Record<string, unknown> {
  const typedState = state as {
    engine: {
      backgroundState: {
        TokensController: {
          allTokens: TokensByNetwork;
        } & Record<string, unknown>;
        CollectiblesController: {
          allCollectibleContracts: TokensByNetwork;
          allCollectibles: TokensByNetwork;
        } & Record<string, unknown>;
        PreferencesController: {
          frequentRpcList: { chainId: string }[];
        } & Record<string, unknown>;
      };
    };
  };

  const { allTokens } = typedState.engine.backgroundState.TokensController;
  const { allCollectibleContracts, allCollectibles } =
    typedState.engine.backgroundState.CollectiblesController;
  const { frequentRpcList } =
    typedState.engine.backgroundState.PreferencesController;

  const newAllCollectibleContracts: TokensByNetwork = {};
  const newAllCollectibles: TokensByNetwork = {};
  const newAllTokens: TokensByNetwork = {};

  Object.keys(allTokens).forEach((address) => {
    newAllTokens[address] = {};
    Object.keys(allTokens[address]).forEach((networkType) => {
      if (LEGACY_NETWORKS_CHAIN_ID[networkType]) {
        newAllTokens[address][LEGACY_NETWORKS_CHAIN_ID[networkType]] =
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
      if (LEGACY_NETWORKS_CHAIN_ID[networkType]) {
        newAllCollectibles[address][LEGACY_NETWORKS_CHAIN_ID[networkType]] =
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
      if (LEGACY_NETWORKS_CHAIN_ID[networkType]) {
        newAllCollectibleContracts[address][
          LEGACY_NETWORKS_CHAIN_ID[networkType]
        ] = allCollectibleContracts[address][networkType];
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

  return state as Record<string, unknown>;
}
