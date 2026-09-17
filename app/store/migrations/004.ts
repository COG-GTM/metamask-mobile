import { isObject } from '@metamask/utils';
import { ensureValidState } from './util';
import { NetworksChainId } from './util/legacyNetworks';

type ByNetwork = Record<string, Record<string, unknown>>;

export default function migrate(state: unknown) {
  if (!ensureValidState(state, 4)) {
    return state;
  }

  const tokensController = state.engine.backgroundState.TokensController;
  const collectiblesController =
    state.engine.backgroundState.CollectiblesController;
  const preferencesController =
    state.engine.backgroundState.PreferencesController;

  if (
    !isObject(tokensController) ||
    !isObject(collectiblesController) ||
    !isObject(preferencesController)
  ) {
    return state;
  }

  const { allTokens } = tokensController;
  const { allCollectibleContracts, allCollectibles } = collectiblesController;
  const { frequentRpcList } = preferencesController;

  const migrateByAddress = (source: unknown): ByNetwork => {
    const result: ByNetwork = {};
    if (!isObject(source)) {
      return result;
    }
    Object.keys(source).forEach((address) => {
      result[address] = {};
      const byNetwork = source[address];
      if (!isObject(byNetwork)) {
        return;
      }
      Object.keys(byNetwork).forEach((networkType) => {
        const chainId = NetworksChainId[networkType];
        if (chainId) {
          result[address][chainId] = byNetwork[networkType];
        } else if (Array.isArray(frequentRpcList)) {
          frequentRpcList.forEach((rpc) => {
            if (isObject(rpc) && typeof rpc.chainId === 'string') {
              result[address][rpc.chainId] = byNetwork[networkType];
            }
          });
        }
      });
    });
    return result;
  };

  const newAllTokens = migrateByAddress(allTokens);
  const newAllCollectibles = migrateByAddress(allCollectibles);
  const newAllCollectibleContracts = migrateByAddress(allCollectibleContracts);

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
