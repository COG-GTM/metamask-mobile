import { isObject } from '@metamask/utils';
import { NetworkType } from '@metamask/controller-utils';

interface TransactionEntry {
  chainId?: string;
  rawTransaction?: string;
  transactionHash?: string;
  origin?: string;
  time?: number;
  transaction?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Populate the submitHistory in the TransactionController using any
 * transaction metadata entries that have a rawTransaction value.
 * @param state - Redux state
 * @returns
 */
export default function migrate(state: unknown): unknown {
  if (!isObject(state)) return state;
  if (!isObject(state.engine)) return state;
  if (!isObject(state.engine.backgroundState)) return state;

  const backgroundState = state.engine.backgroundState;

  const transactionControllerState = backgroundState.TransactionController as Record<string, unknown> | undefined;

  if (!transactionControllerState) return state;

  const transactions = (transactionControllerState.transactions || []) as TransactionEntry[];
  const networkControllerState = (backgroundState.NetworkController || {}) as Record<string, unknown>;
  const providerConfig = (networkControllerState.providerConfig || {}) as Record<string, unknown>;

  const networkConfigurations =
    (networkControllerState.networkConfigurations || {}) as Record<string, Record<string, unknown>>;

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

  (backgroundState.TransactionController as Record<string, unknown>).submitHistory =
    submitHistory;

  return state;
}
