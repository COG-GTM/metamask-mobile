import { NetworkType } from '@metamask/controller-utils';

/**
 * Populate the submitHistory in the TransactionController using any
 * transaction metadata entries that have a rawTransaction value.
 * @param {any} state - Redux state
 * @returns
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function migrate(state: any) {
  const backgroundState = state.engine.backgroundState;

  const transactionControllerState = backgroundState.TransactionController;

  if (!transactionControllerState) return state;

  const transactions = transactionControllerState.transactions || [];
  const networkControllerState = backgroundState.NetworkController || {};
  const providerConfig = networkControllerState.providerConfig || {};

  const networkConfigurations =
    networkControllerState.networkConfigurations || {};

  const submitHistory = transactions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((tx: any) => tx.rawTransaction?.length)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((tx: any) => {
      const matchingProviderConfig =
        providerConfig.chainId === tx.chainId ? providerConfig : undefined;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const matchingNetworkConfigurations = Object.values(
        networkConfigurations,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ).filter((c: any) => c.chainId === tx.chainId);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const networkUrl = matchingNetworkConfigurations.map((c: any) => c.rpcUrl);

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

  state.engine.backgroundState.TransactionController.submitHistory =
    submitHistory;

  return state;
}
