import { isObject } from '@metamask/utils';

const NetworksChainId: Record<string, string> = {
  mainnet: '1',
  goerli: '5',
  sepolia: '11155111',
  'linea-goerli': '59140',
  'linea-mainnet': '59144',
  'linea-sepolia': '59141',
  localhost: '1337',
  rpc: '',
};

export default function migrate(state: unknown): unknown {
  if (!isObject(state)) return state;
  if (!isObject(state.engine)) return state;
  if (!isObject(state.engine.backgroundState)) return state;

  const bgState = state.engine.backgroundState;

  const tokensController = bgState.TokensController as Record<string, unknown> | undefined;
  const collectiblesController = bgState.CollectiblesController as Record<string, unknown> | undefined;
  const preferencesController = bgState.PreferencesController as Record<string, unknown> | undefined;

  if (!isObject(tokensController) || !isObject(collectiblesController) || !isObject(preferencesController)) {
    return state;
  }

  const allTokens = tokensController.allTokens as Record<string, Record<string, unknown>> | undefined;
  const allCollectibleContracts = collectiblesController.allCollectibleContracts as Record<string, Record<string, unknown>> | undefined;
  const allCollectibles = collectiblesController.allCollectibles as Record<string, Record<string, unknown>> | undefined;
  const frequentRpcList = preferencesController.frequentRpcList as { chainId: string }[] | undefined;

  if (!allTokens || !allCollectibleContracts || !allCollectibles || !frequentRpcList) {
    return state;
  }

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

  bgState.TokensController = {
    ...tokensController,
    allTokens: newAllTokens,
  };
  bgState.CollectiblesController = {
    ...collectiblesController,
    allCollectibles: newAllCollectibles,
    allCollectibleContracts: newAllCollectibleContracts,
  };
  return state;
}
