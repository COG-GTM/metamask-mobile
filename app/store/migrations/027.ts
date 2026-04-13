import { NetworkType } from '@metamask/controller-utils';
import { hasProperty, isObject } from '@metamask/utils';
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
        `Migration 27: Invalid engine state: '${typeof state.engine}'`,
      ),
    );
    return state;
  }

  if (!isObject(state.engine.backgroundState)) {
    captureException(
      new Error(
        `Migration 27: Invalid engine backgroundState: '${typeof state.engine
          .backgroundState}'`,
      ),
    );
    return state;
  }

  const backgroundState = state.engine.backgroundState;

  const transactionControllerState = backgroundState.TransactionController;

  if (!isObject(transactionControllerState)) return state;

  const transactions = Array.isArray(transactionControllerState.transactions)
    ? transactionControllerState.transactions
    : [];

  const networkControllerState = isObject(backgroundState.NetworkController)
    ? backgroundState.NetworkController
    : {};

  const providerConfig =
    isObject(networkControllerState) &&
    hasProperty(networkControllerState, 'providerConfig') &&
    isObject(networkControllerState.providerConfig)
      ? networkControllerState.providerConfig
      : {};

  const networkConfigurations =
    isObject(networkControllerState) &&
    hasProperty(networkControllerState, 'networkConfigurations') &&
    isObject(networkControllerState.networkConfigurations)
      ? networkControllerState.networkConfigurations
      : {};

  const submitHistory = transactions
    .filter(
      (tx: unknown) =>
        isObject(tx) &&
        hasProperty(tx, 'rawTransaction') &&
        typeof tx.rawTransaction === 'string' &&
        tx.rawTransaction.length,
    )
    .map((tx: unknown) => {
      const txObj = tx as Record<string, unknown>;

      const matchingProviderConfig =
        hasProperty(providerConfig, 'chainId') &&
        providerConfig.chainId === txObj.chainId
          ? providerConfig
          : undefined;

      const matchingNetworkConfigurations = Object.values(
        networkConfigurations,
      ).filter(
        (c: unknown) => isObject(c) && c.chainId === txObj.chainId,
      );

      const networkUrl = matchingNetworkConfigurations.map((c: unknown) =>
        isObject(c) ? c.rpcUrl : undefined,
      );

      const networkType = matchingProviderConfig
        ? matchingProviderConfig.type
        : matchingNetworkConfigurations?.length
          ? NetworkType.rpc
          : undefined;

      return {
        chainId: txObj.chainId,
        hash: txObj.transactionHash,
        migration: true,
        networkType,
        networkUrl,
        origin: txObj.origin,
        time: txObj.time,
        transaction: txObj.transaction,
        rawTransaction: txObj.rawTransaction,
      };
    });

  transactionControllerState.submitHistory = submitHistory;

  return state;
}
