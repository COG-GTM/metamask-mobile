import { NetworksChainId } from '@metamask/controller-utils';
import { isObject } from '@metamask/utils';

interface RpcConfig {
  chainId: string;
}

type TokensMap = Record<string, Record<string, unknown>>;
type CollectiblesMap = Record<string, Record<string, unknown>>;

export default function migrate(state: unknown): unknown {
  if (!isObject(state)) return state;
  if (!isObject(state.engine)) return state;
  if (!isObject(state.engine.backgroundState)) return state;

  const backgroundState = state.engine.backgroundState as Record<string, unknown>;
  const tokensController = backgroundState.TokensController as Record<string, unknown> | undefined;
  const collectiblesController = backgroundState.CollectiblesController as Record<string, unknown> | undefined;
  const preferencesController = backgroundState.PreferencesController as Record<string, unknown> | undefined;

  if (!tokensController || !collectiblesController || !preferencesController) return state;

  const allTokens = (tokensController.allTokens || {}) as TokensMap;
  const allCollectibleContracts = (collectiblesController.allCollectibleContracts || {}) as CollectiblesMap;
  const allCollectibles = (collectiblesController.allCollectibles || {}) as CollectiblesMap;
  const frequentRpcList = (preferencesController.frequentRpcList || []) as RpcConfig[];

  const newAllCollectibleContracts: TokensMap = {};
  const newAllCollectibles: TokensMap = {};
  const newAllTokens: TokensMap = {};

  Object.keys(allTokens).forEach((address) => {
    newAllTokens[address] = {};
    Object.keys(allTokens[address]).forEach((networkType) => {
      if ((NetworksChainId as Record<string, string>)[networkType]) {
        newAllTokens[address][(NetworksChainId as Record<string, string>)[networkType]] =
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
      if ((NetworksChainId as Record<string, string>)[networkType]) {
        newAllCollectibles[address][(NetworksChainId as Record<string, string>)[networkType]] =
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
      if ((NetworksChainId as Record<string, string>)[networkType]) {
        newAllCollectibleContracts[address][(NetworksChainId as Record<string, string>)[networkType]] =
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
    ...tokensController,
    allTokens: newAllTokens,
  };
  backgroundState.CollectiblesController = {
    ...collectiblesController,
    allCollectibles: newAllCollectibles,
    allCollectibleContracts: newAllCollectibleContracts,
  };
  return state;
}
