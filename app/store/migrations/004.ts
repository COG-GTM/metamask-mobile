/**
 * Mapping of built-in network type names to their decimal chain IDs.
 * Inlined because `NetworksChainId` was removed from `@metamask/controller-utils`.
 */
const NetworksChainId: Record<string, string> = {
  mainnet: '1',
  goerli: '5',
  sepolia: '11155111',
  'linea-goerli': '59140',
  'linea-mainnet': '59144',
  'linea-sepolia': '59141',
};
import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

export default function migrate(state: unknown): unknown {
  if (!isObject(state)) {
    captureException(
      new Error(`Migration 004: Invalid root state: '${typeof state}'`),
    );
    return state;
  }

  if (
    !isObject(state.engine) ||
    !isObject(
      (state.engine as Record<string, unknown>).backgroundState,
    )
  ) {
    captureException(
      new Error(`Migration 004: Invalid engine or backgroundState`),
    );
    return state;
  }

  const backgroundState = (state.engine as Record<string, unknown>)
    .backgroundState as Record<string, unknown>;

  if (
    !isObject(backgroundState.TokensController) ||
    !isObject(backgroundState.CollectiblesController) ||
    !isObject(backgroundState.PreferencesController)
  ) {
    captureException(
      new Error(
        `Migration 004: Invalid controller state`,
      ),
    );
    return state;
  }

  const tokensController = backgroundState.TokensController as Record<
    string,
    unknown
  >;
  const collectiblesController =
    backgroundState.CollectiblesController as Record<string, unknown>;
  const preferencesController =
    backgroundState.PreferencesController as Record<string, unknown>;

  const allTokens = tokensController.allTokens as Record<
    string,
    Record<string, unknown>
  >;
  const allCollectibleContracts =
    collectiblesController.allCollectibleContracts as Record<
      string,
      Record<string, unknown>
    >;
  const allCollectibles = collectiblesController.allCollectibles as Record<
    string,
    Record<string, unknown>
  >;
  const frequentRpcList = preferencesController.frequentRpcList as Array<{
    chainId: string;
  }>;

  const newAllCollectibleContracts: Record<
    string,
    Record<string, unknown>
  > = {};
  const newAllCollectibles: Record<string, Record<string, unknown>> = {};
  const newAllTokens: Record<string, Record<string, unknown>> = {};

  if (isObject(allTokens)) {
    Object.keys(allTokens).forEach((address) => {
      newAllTokens[address] = {};
      Object.keys(allTokens[address]).forEach((networkType) => {
        if (
          (NetworksChainId as Record<string, string>)[networkType]
        ) {
          newAllTokens[address][
            (NetworksChainId as Record<string, string>)[networkType]
          ] = allTokens[address][networkType];
        } else if (Array.isArray(frequentRpcList)) {
          frequentRpcList.forEach(({ chainId }) => {
            newAllTokens[address][chainId] =
              allTokens[address][networkType];
          });
        }
      });
    });
  }

  if (isObject(allCollectibles)) {
    Object.keys(allCollectibles).forEach((address) => {
      newAllCollectibles[address] = {};
      Object.keys(allCollectibles[address]).forEach((networkType) => {
        if (
          (NetworksChainId as Record<string, string>)[networkType]
        ) {
          newAllCollectibles[address][
            (NetworksChainId as Record<string, string>)[networkType]
          ] = allCollectibles[address][networkType];
        } else if (Array.isArray(frequentRpcList)) {
          frequentRpcList.forEach(({ chainId }) => {
            newAllCollectibles[address][chainId] =
              allCollectibles[address][networkType];
          });
        }
      });
    });
  }

  if (isObject(allCollectibleContracts)) {
    Object.keys(allCollectibleContracts).forEach((address) => {
      newAllCollectibleContracts[address] = {};
      Object.keys(allCollectibleContracts[address]).forEach((networkType) => {
        if (
          (NetworksChainId as Record<string, string>)[networkType]
        ) {
          newAllCollectibleContracts[address][
            (NetworksChainId as Record<string, string>)[networkType]
          ] = allCollectibleContracts[address][networkType];
        } else if (Array.isArray(frequentRpcList)) {
          frequentRpcList.forEach(({ chainId }) => {
            newAllCollectibleContracts[address][chainId] =
              allCollectibleContracts[address][networkType];
          });
        }
      });
    });
  }

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
