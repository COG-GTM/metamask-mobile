import { isObject } from '@metamask/utils';
import { NetworkType } from '@metamask/controller-utils';
import { ensureValidState } from './util';

interface SubmitHistoryEntry {
  chainId: unknown;
  hash: unknown;
  migration: true;
  networkType: string | undefined;
  networkUrl: unknown[];
  origin: unknown;
  time: unknown;
  transaction: unknown;
  rawTransaction: unknown;
}

/**
 * Populate the submitHistory in the TransactionController using any
 * transaction metadata entries that have a rawTransaction value.
 *
 * @param state - Redux state
 * @returns Migrated Redux state
 */
export default function migrate(state: unknown) {
  if (!ensureValidState(state, 27)) {
    return state;
  }

  const { backgroundState } = state.engine;
  const transactionControllerState = backgroundState.TransactionController;

  if (!isObject(transactionControllerState)) return state;

  const transactions = Array.isArray(transactionControllerState.transactions)
    ? transactionControllerState.transactions
    : [];
  const networkControllerState = isObject(backgroundState.NetworkController)
    ? backgroundState.NetworkController
    : {};
  const providerConfig = isObject(networkControllerState.providerConfig)
    ? networkControllerState.providerConfig
    : {};
  const networkConfigurations = isObject(
    networkControllerState.networkConfigurations,
  )
    ? networkControllerState.networkConfigurations
    : {};

  const submitHistory: SubmitHistoryEntry[] = transactions
    .filter(
      (tx: unknown) =>
        isObject(tx) &&
        typeof tx.rawTransaction === 'string' &&
        tx.rawTransaction.length > 0,
    )
    .map((tx: Record<string, unknown>) => {
      const matchingProviderConfig =
        providerConfig.chainId === tx.chainId ? providerConfig : undefined;

      const matchingNetworkConfigurations = Object.values(
        networkConfigurations,
      ).filter(
        (networkConfiguration) =>
          isObject(networkConfiguration) &&
          networkConfiguration.chainId === tx.chainId,
      );

      const networkUrl = matchingNetworkConfigurations.map(
        (networkConfiguration) =>
          isObject(networkConfiguration)
            ? networkConfiguration.rpcUrl
            : undefined,
      );

      let networkType;
      if (matchingProviderConfig) {
        networkType =
          typeof matchingProviderConfig.type === 'string'
            ? matchingProviderConfig.type
            : undefined;
      } else if (matchingNetworkConfigurations.length) {
        networkType = NetworkType.rpc;
      }

      return {
        chainId: tx.chainId,
        hash: tx.transactionHash,
        migration: true as const,
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
