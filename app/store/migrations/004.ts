// Historical decimal chain ID mapping by network type, captured at the time
// this migration was authored. The upstream package has since switched to
// hex strings, so we keep these literals locally to preserve original
// migration semantics.
const NetworksChainIdLegacy: Record<string, string> = {
  mainnet: '1',
  goerli: '5',
  sepolia: '11155111',
  rpc: '',
};

type AddressMap<T> = Record<string, Record<string, T>>;

interface FrequentRpcEntry {
  chainId: string;
  [key: string]: unknown;
}

interface State004 {
  engine: {
    backgroundState: {
      TokensController: {
        allTokens: AddressMap<unknown>;
        [key: string]: unknown;
      };
      CollectiblesController: {
        allCollectibleContracts: AddressMap<unknown>;
        allCollectibles: AddressMap<unknown>;
        [key: string]: unknown;
      };
      PreferencesController: {
        frequentRpcList: FrequentRpcEntry[];
      };
    };
  };
}

export default function migrate(state: unknown): unknown {
  const typedState = state as State004;
  const { allTokens } = typedState.engine.backgroundState.TokensController;
  const { allCollectibleContracts, allCollectibles } =
    typedState.engine.backgroundState.CollectiblesController;
  const { frequentRpcList } =
    typedState.engine.backgroundState.PreferencesController;

  const newAllCollectibleContracts: AddressMap<unknown> = {};
  const newAllCollectibles: AddressMap<unknown> = {};
  const newAllTokens: AddressMap<unknown> = {};

  Object.keys(allTokens).forEach((address) => {
    newAllTokens[address] = {};
    Object.keys(allTokens[address]).forEach((networkType) => {
      const chainIdForType = NetworksChainIdLegacy[networkType];
      if (chainIdForType) {
        newAllTokens[address][chainIdForType] = allTokens[address][networkType];
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
      const chainIdForType = NetworksChainIdLegacy[networkType];
      if (chainIdForType) {
        newAllCollectibles[address][chainIdForType] =
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
      const chainIdForType = NetworksChainIdLegacy[networkType];
      if (chainIdForType) {
        newAllCollectibleContracts[address][chainIdForType] =
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
  return state;
}
