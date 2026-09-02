import { NetworkType } from '@metamask/controller-utils';
import { hasProperty, isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

interface TransactionMeta {
  chainId?: string;
  transactionHash?: string;
  origin?: string;
  time?: number;
  transaction?: unknown;
  rawTransaction?: string;
}

interface NetworkConfiguration {
  chainId?: string;
  rpcUrl?: string;
}

interface ProviderConfig {
  chainId?: string;
  type?: NetworkType | string;
}

/**
 * Populate the submitHistory in the TransactionController using any
 * transaction metadata entries that have a rawTransaction value.
 * @param state - Redux state
 * @returns
 */
export default function migrate(state: unknown) {
  if (
    !isObject(state) ||
    !hasProperty(state, 'engine') ||
    !isObject(state.engine) ||
    !hasProperty(state.engine, 'backgroundState') ||
    !isObject(state.engine.backgroundState)
  ) {
    captureException(
      new Error(
        'Migration 27: Invalid root state: root state is not an object',
      ),
    );
    return state;
  }

  const backgroundState = state.engine.backgroundState;

  const transactionControllerState = backgroundState.TransactionController;

  if (!isObject(transactionControllerState)) return state;

  const transactions = (
    Array.isArray(transactionControllerState.transactions)
      ? transactionControllerState.transactions
      : []
  ) as TransactionMeta[];
  const networkControllerState = backgroundState.NetworkController;
  const providerConfig = (
    isObject(networkControllerState) &&
    isObject(networkControllerState.providerConfig)
      ? networkControllerState.providerConfig
      : {}
  ) as ProviderConfig;

  const networkConfigurations = (
    isObject(networkControllerState) &&
    isObject(networkControllerState.networkConfigurations)
      ? networkControllerState.networkConfigurations
      : {}
  ) as Record<string, NetworkConfiguration>;

  const submitHistory = transactions
    .filter((tx) => tx.rawTransaction?.length)
    .map((tx) => {
      const matchingProviderConfig =
        providerConfig.chainId === tx.chainId ? providerConfig : undefined;

      const matchingNetworkConfigurations = Object.values(
        networkConfigurations,
      ).filter((c) => c.chainId === tx.chainId);

      const networkUrl = matchingNetworkConfigurations.map((c) => c.rpcUrl);

      const networkType = matchingProviderConfig
        ? matchingProviderConfig.type
        : matchingNetworkConfigurations?.length
        ? NetworkType.rpc
        : undefined;

      return {
        chainId: tx.chainId,
        hash: tx.transactionHash,
        migration: true,
        networkType,
        networkUrl,
        origin: tx.origin,
        time: tx.time,
        transaction: tx.transaction,
        rawTransaction: tx.rawTransaction,
      };
    });

  transactionControllerState.submitHistory = submitHistory;

  return state;
}
