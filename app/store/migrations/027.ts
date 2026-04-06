import { NetworkType } from '@metamask/controller-utils';
import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

/**
 * Populate the submitHistory in the TransactionController using any
 * transaction metadata entries that have a rawTransaction value.
 * @param {unknown} state - Redux state
 * @returns Migrated Redux state.
 */
export default function migrate(state: unknown) {
  if (!isObject(state)) {
    captureException(
      new Error(`Migration 27: Invalid root state: '${typeof state}'`),
    );
    return state;
  }

  if (!isObject(state.engine)) {
    captureException(
      new Error(
        `Migration 27: Invalid root engine state: '${typeof state.engine}'`,
      ),
    );
    return state;
  }

  if (!isObject(state.engine.backgroundState)) {
    captureException(
      new Error(
        `Migration 27: Invalid root engine backgroundState: '${typeof state.engine.backgroundState}'`,
      ),
    );
    return state;
  }

  const backgroundState = state.engine.backgroundState;

  const transactionControllerState = backgroundState.TransactionController as
    | Record<string, unknown>
    | undefined;

  if (!transactionControllerState) return state;

  const transactions = (transactionControllerState.transactions ||
    []) as Record<string, unknown>[];
  const networkControllerState = (backgroundState.NetworkController ||
    {}) as Record<string, unknown>;
  const providerConfig = (networkControllerState.providerConfig ||
    {}) as Record<string, unknown>;

  const networkConfigurations = (networkControllerState.networkConfigurations ||
    {}) as Record<string, Record<string, unknown>>;

  const submitHistory = transactions
    .filter(
      (tx) =>
        typeof tx.rawTransaction === 'string' && tx.rawTransaction.length > 0,
    )
    .map((tx) => {
      const matchingProviderConfig =
        providerConfig.chainId === tx.chainId ? providerConfig : undefined;

      const matchingNetworkConfigurations = Object.values(
        networkConfigurations,
      ).filter((c) => c.chainId === tx.chainId);

      const networkUrl = matchingNetworkConfigurations.map(
        (c) => c.rpcUrl as string,
      );

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
