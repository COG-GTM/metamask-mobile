import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

/**
 * Legacy mapping of network type names to their decimal chain IDs.
 * Previously exported as NetworksChainId from @metamask/controller-utils
 * but since removed.
 */
const NetworksChainId: Record<string, string> = {
  mainnet: '1',
  ropsten: '3',
  rinkeby: '4',
  goerli: '5',
  kovan: '42',
  sepolia: '11155111',
  'linea-goerli': '59140',
  'linea-sepolia': '59141',
  'linea-mainnet': '59144',
};

/**
 * Migrate allTokens, allCollectibles, allCollectibleContracts
 * from network type keys to chainId keys.
 *
 * @param state - Redux state.
 * @returns Migrated Redux state.
 */
export default function migrate(state: unknown) {
  if (!isObject(state)) {
    captureException(
      new Error(`Migration 4: Invalid root state: '${typeof state}'`),
    );
    return state;
  }

  if (!isObject(state.engine)) {
    captureException(
      new Error(
        `Migration 4: Invalid engine state: '${typeof state.engine}'`,
      ),
    );
    return state;
  }

  if (!isObject(state.engine.backgroundState)) {
    captureException(
      new Error(
        `Migration 4: Invalid engine backgroundState: '${typeof state.engine
          .backgroundState}'`,
      ),
    );
    return state;
  }

  if (!isObject(state.engine.backgroundState.TokensController)) {
    captureException(
      new Error(`Migration 4: Invalid TokensController state`),
    );
    return state;
  }

  if (!isObject(state.engine.backgroundState.CollectiblesController)) {
    captureException(
      new Error(`Migration 4: Invalid CollectiblesController state`),
    );
    return state;
  }

  if (!isObject(state.engine.backgroundState.PreferencesController)) {
    captureException(
      new Error(`Migration 4: Invalid PreferencesController state`),
    );
    return state;
  }

  const allTokens = state.engine.backgroundState.TokensController
    .allTokens as Record<string, Record<string, unknown>>;
  const allCollectibleContracts = (
    state.engine.backgroundState.CollectiblesController as Record<string, unknown>
  ).allCollectibleContracts as Record<string, Record<string, unknown>>;
  const allCollectibles = (
    state.engine.backgroundState.CollectiblesController as Record<string, unknown>
  ).allCollectibles as Record<string, Record<string, unknown>>;
  const frequentRpcList = (
    state.engine.backgroundState.PreferencesController as Record<string, unknown>
  ).frequentRpcList as Array<{ chainId: string }>;

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

  state.engine.backgroundState.TokensController = {
    ...state.engine.backgroundState.TokensController,
    allTokens: newAllTokens,
  };
  state.engine.backgroundState.CollectiblesController = {
    ...state.engine.backgroundState.CollectiblesController,
    allCollectibles: newAllCollectibles,
    allCollectibleContracts: newAllCollectibleContracts,
  };
  return state;
}
