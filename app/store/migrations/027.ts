import { NetworkType } from '@metamask/controller-utils';
import { isObject } from '@metamask/utils';
import { ensureValidState } from './util';

/**
 * Populate the submitHistory in the TransactionController using any
 * transaction metadata entries that have a rawTransaction value.
 *
 * @param state - Redux state
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
  const providerConfig: Record<string, unknown> = isObject(
    networkControllerState.providerConfig,
  )
    ? networkControllerState.providerConfig
    : {};

  const networkConfigurations: Record<string, unknown> = isObject(
    networkControllerState.networkConfigurations,
  )
    ? networkControllerState.networkConfigurations
    : {};

  const submitHistory = transactions
    .filter(
      (tx): tx is Record<string, unknown> =>
        isObject(tx) &&
        typeof tx.rawTransaction === 'string' &&
        tx.rawTransaction.length > 0,
    )
    .map((tx) => {
      const matchingProviderConfig =
        providerConfig.chainId === tx.chainId ? providerConfig : undefined;

      const matchingNetworkConfigurations = Object.values(
        networkConfigurations,
      ).filter((c) => isObject(c) && c.chainId === tx.chainId);

      const networkUrl = matchingNetworkConfigurations.map((c) =>
        isObject(c) ? c.rpcUrl : undefined,
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
