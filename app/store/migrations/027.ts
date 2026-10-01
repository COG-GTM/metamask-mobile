import { NetworkType } from '@metamask/controller-utils';

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

/**
 * Populate the submitHistory in the TransactionController using any
 * transaction metadata entries that have a rawTransaction value.
 * @param state - Redux state
 * @returns
 */
export default function migrate(state: unknown): Record<string, unknown> {
  const backgroundState = (
    state as { engine: { backgroundState: Record<string, unknown> } }
  ).engine.backgroundState;

  const transactionControllerState = backgroundState.TransactionController as
    | { transactions?: TransactionMeta[]; submitHistory?: unknown }
    | undefined;

  if (!transactionControllerState) return state as Record<string, unknown>;

  const transactions = transactionControllerState.transactions || [];
  const networkControllerState = (backgroundState.NetworkController || {}) as {
    providerConfig?: { chainId?: string; type?: string };
    networkConfigurations?: Record<string, NetworkConfiguration>;
  };
  const providerConfig = networkControllerState.providerConfig || {};

  const networkConfigurations =
    networkControllerState.networkConfigurations || {};

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

  return state as Record<string, unknown>;
}
