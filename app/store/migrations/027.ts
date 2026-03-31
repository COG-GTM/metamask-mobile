import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';
import { NetworkType } from '@metamask/controller-utils';

/**
 * Populate the submitHistory in the TransactionController using any
 * transaction metadata entries that have a rawTransaction value.
 * @param {unknown} state - Redux state
 * @returns
 */
export default function migrate(state: unknown) {
  if (!isObject(state)) {
    captureException(
      new Error(`Migration 27: Invalid root state: root state is not an object`),
    );
    return state;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const typedState = state as Record<string, any>;
  const backgroundState = typedState.engine.backgroundState;

  const transactionControllerState = backgroundState.TransactionController;

  if (!transactionControllerState) return typedState;

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

  typedState.engine.backgroundState.TransactionController.submitHistory =
    submitHistory;

  return typedState;
}
