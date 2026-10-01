import { NetworkType } from '@metamask/controller-utils';
import { isObject } from '@metamask/utils';

/**
 * Populate the submitHistory in the TransactionController using any
 * transaction metadata entries that have a rawTransaction value.
 * @param {unknown} state - Redux state
 * @returns
 */
export default function migrate(state: unknown): Record<string, unknown> {
  if (!isObject(state)) {
    return state as Record<string, unknown>;
  }

  if (
    !isObject(state.engine) ||
    !isObject((state.engine as Record<string, unknown>).backgroundState)
  ) {
    return state as Record<string, unknown>;
  }

  const engine = state.engine as Record<string, unknown>;
  const backgroundState = engine.backgroundState as Record<string, unknown>;

  const transactionControllerState = backgroundState.TransactionController as Record<string, unknown> | undefined;

  if (!transactionControllerState) return state as Record<string, unknown>;

  const transactions = (transactionControllerState.transactions as Array<Record<string, unknown>>) || [];
  const networkControllerState = (backgroundState.NetworkController as Record<string, unknown>) || {};
  const providerConfig = (networkControllerState.providerConfig as Record<string, unknown>) || {};

  const networkConfigurations =
    (networkControllerState.networkConfigurations as Record<string, Record<string, unknown>>) || {};

  const submitHistory = transactions
    .filter((tx) => (tx.rawTransaction as string)?.length)
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

  return state as Record<string, unknown>;
}
