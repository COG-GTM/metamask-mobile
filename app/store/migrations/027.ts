import { NetworkType } from '@metamask/controller-utils';

/**
 * Populate the submitHistory in the TransactionController using any
 * transaction metadata entries that have a rawTransaction value.
 * @param state - Redux state
 * @returns
 */
export default function migrate(state: unknown): unknown {
  const s = state as {
    engine: { backgroundState: Record<string, Record<string, unknown>> };
  };
  const backgroundState = s.engine.backgroundState;

  const transactionControllerState = backgroundState.TransactionController;

  if (!transactionControllerState) return state;

  const transactions = (transactionControllerState.transactions || []) as {
    rawTransaction?: string;
    chainId: string;
    transactionHash: string;
    origin: string;
    time: number;
    transaction: unknown;
  }[];
  const networkControllerState = (backgroundState.NetworkController || {}) as Record<string, unknown>;
  const providerConfig = (networkControllerState.providerConfig || {}) as Record<string, string>;

  const networkConfigurations =
    (networkControllerState.networkConfigurations || {}) as Record<string, { chainId: string; rpcUrl: string }>;

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

  s.engine.backgroundState.TransactionController.submitHistory =
    submitHistory;

  return state;
}
