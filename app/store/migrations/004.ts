import { isObject, hasProperty } from '@metamask/utils';
import { ChainId } from '@metamask/controller-utils';

// Map of network types to chain IDs
const NetworksChainId: Record<string, string> = {
  mainnet: ChainId.mainnet,
  goerli: ChainId.goerli,
  sepolia: ChainId.sepolia,
  'linea-goerli': ChainId['linea-goerli'],
  'linea-sepolia': ChainId['linea-sepolia'],
  'linea-mainnet': ChainId['linea-mainnet'],
};

export default function migrate(state: unknown): unknown {
  if (!isObject(state)) {
    return state;
  }

  if (!isObject(state.engine)) {
    return state;
  }

  if (!isObject(state.engine.backgroundState)) {
    return state;
  }

  const tokensControllerState = state.engine.backgroundState.TokensController;
  const collectiblesControllerState = state.engine.backgroundState.CollectiblesController;
  const preferencesControllerState = state.engine.backgroundState.PreferencesController;

  if (!isObject(tokensControllerState) || !hasProperty(tokensControllerState, 'allTokens')) {
    return state;
  }

  if (!isObject(collectiblesControllerState) || 
      !hasProperty(collectiblesControllerState, 'allCollectibleContracts') ||
      !hasProperty(collectiblesControllerState, 'allCollectibles')) {
    return state;
  }

  if (!isObject(preferencesControllerState) || !hasProperty(preferencesControllerState, 'frequentRpcList')) {
    return state;
  }

  const allTokens = tokensControllerState.allTokens as Record<string, Record<string, unknown>>;
  const allCollectibleContracts = collectiblesControllerState.allCollectibleContracts as Record<string, Record<string, unknown>>;
  const allCollectibles = collectiblesControllerState.allCollectibles as Record<string, Record<string, unknown>>;
  const frequentRpcList = preferencesControllerState.frequentRpcList as Array<{ chainId: string }>;

  const newAllCollectibleContracts: Record<string, Record<string, unknown>> = {};
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

  tokensControllerState.allTokens = newAllTokens;
  collectiblesControllerState.allCollectibles = newAllCollectibles;
  collectiblesControllerState.allCollectibleContracts = newAllCollectibleContracts;

  return state;
}
