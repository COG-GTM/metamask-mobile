import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

interface FrequentRpcEntry {
  chainId: string;
  [key: string]: unknown;
}

type AddressMap<T> = Record<string, Record<string, T>>;

// Decimal chain IDs of well-known networks at the time this migration ran.
// Replaces the deprecated `NetworksChainId` enum from `@metamask/controller-utils`.
const NETWORKS_CHAIN_ID: Record<string, string> = {
  mainnet: '1',
  ropsten: '3',
  rinkeby: '4',
  goerli: '5',
  kovan: '42',
  rpc: '',
  localhost: '',
};

export default function migrate(state: unknown) {
  if (
    !isObject(state) ||
    !isObject(state.engine) ||
    !isObject(state.engine.backgroundState) ||
    !isObject(state.engine.backgroundState.TokensController) ||
    !isObject(state.engine.backgroundState.CollectiblesController) ||
    !isObject(state.engine.backgroundState.PreferencesController)
  ) {
    captureException(
      new Error(`Migration 4: Invalid state structure for migration`),
    );
    return state;
  }

  const tokensController = state.engine.backgroundState.TokensController as {
    allTokens: AddressMap<unknown>;
  };
  const collectiblesController = state.engine.backgroundState
    .CollectiblesController as {
    allCollectibleContracts: AddressMap<unknown>;
    allCollectibles: AddressMap<unknown>;
  };
  const preferencesController = state.engine.backgroundState
    .PreferencesController as {
    frequentRpcList: FrequentRpcEntry[];
  };

  const { allTokens } = tokensController;
  const { allCollectibleContracts, allCollectibles } = collectiblesController;
  const { frequentRpcList } = preferencesController;

  const newAllCollectibleContracts: AddressMap<unknown> = {};
  const newAllCollectibles: AddressMap<unknown> = {};
  const newAllTokens: AddressMap<unknown> = {};

  Object.keys(allTokens).forEach((address) => {
    newAllTokens[address] = {};
    Object.keys(allTokens[address]).forEach((networkType) => {
      const mappedChainId = NETWORKS_CHAIN_ID[networkType];
      if (mappedChainId) {
        newAllTokens[address][mappedChainId] = allTokens[address][networkType];
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
      const mappedChainId = NETWORKS_CHAIN_ID[networkType];
      if (mappedChainId) {
        newAllCollectibles[address][mappedChainId] =
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
      const mappedChainId = NETWORKS_CHAIN_ID[networkType];
      if (mappedChainId) {
        newAllCollectibleContracts[address][mappedChainId] =
          allCollectibleContracts[address][networkType];
      } else {
        frequentRpcList.forEach(({ chainId }) => {
          newAllCollectibleContracts[address][chainId] =
            allCollectibleContracts[address][networkType];
        });
      }
    });
  });

  state.engine.backgroundState.TokensController = {
    ...tokensController,
    allTokens: newAllTokens,
  };
  state.engine.backgroundState.CollectiblesController = {
    ...collectiblesController,
    allCollectibles: newAllCollectibles,
    allCollectibleContracts: newAllCollectibleContracts,
  };
  return state;
}
