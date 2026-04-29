import { NetworkType } from '@metamask/controller-utils';

interface TransactionMeta {
  rawTransaction?: string;
  chainId?: string;
  transactionHash?: string;
  origin?: string;
  time?: number;
  transaction?: Record<string, unknown>;
  [key: string]: unknown;
}

interface NetworkConfiguration {
  chainId?: string;
  rpcUrl?: string;
  [key: string]: unknown;
}

/**
 * Populate the submitHistory in the TransactionController using any
 * transaction metadata entries that have a rawTransaction value.
 */
export default function migrate(state: Record<string, unknown>) {
  const engineState = state.engine as Record<string, Record<string, Record<string, unknown>>>;
  const backgroundState = engineState.backgroundState;

  const transactionControllerState = backgroundState.TransactionController as Record<string, unknown> | undefined;

  if (!transactionControllerState) return state;

  const transactions = (transactionControllerState.transactions || []) as TransactionMeta[];
  const networkControllerState = (backgroundState.NetworkController || {}) as Record<string, unknown>;
  const providerConfig = (networkControllerState.providerConfig || {}) as Record<string, unknown>;

  const networkConfigurations =
    (networkControllerState.networkConfigurations || {}) as Record<string, NetworkConfiguration>;

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
