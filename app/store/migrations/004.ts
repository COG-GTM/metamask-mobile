const NetworksChainId: Record<string, string> = {
  mainnet: '1',
  goerli: '5',
  sepolia: '11155111',
  'linea-goerli': '59140',
  'linea-mainnet': '59144',
};

interface MigrationState {
  engine: {
    backgroundState: {
      TokensController: {
        allTokens: Record<string, Record<string, unknown>>;
        [key: string]: unknown;
      };
      CollectiblesController: {
        allCollectibleContracts: Record<string, Record<string, unknown>>;
        allCollectibles: Record<string, Record<string, unknown>>;
        [key: string]: unknown;
      };
      PreferencesController: {
        frequentRpcList: { chainId: string }[];
      };
    };
  };
}

export default function migrate(state: unknown): unknown {
  const s = state as MigrationState;
  const { allTokens } = s.engine.backgroundState.TokensController;
  const { allCollectibleContracts, allCollectibles } =
    s.engine.backgroundState.CollectiblesController;
  const { frequentRpcList } =
    s.engine.backgroundState.PreferencesController;

  const newAllCollectibleContracts: Record<string, Record<string, unknown>> =
    {};
  const newAllCollectibles: Record<string, Record<string, unknown>> = {};
  const newAllTokens: Record<string, Record<string, unknown>> = {};

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

  s.engine.backgroundState.TokensController = {
    ...s.engine.backgroundState.TokensController,
    allTokens: newAllTokens,
  };
  s.engine.backgroundState.CollectiblesController = {
    ...s.engine.backgroundState.CollectiblesController,
    allCollectibles: newAllCollectibles,
    allCollectibleContracts: newAllCollectibleContracts,
  };
  return state;
}
