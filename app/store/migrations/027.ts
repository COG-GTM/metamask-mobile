import type { MigrationState } from './migration-types';
import { NetworkType } from '@metamask/controller-utils';

/**
 * Populate the submitHistory in the TransactionController using any
 * transaction metadata entries that have a rawTransaction value.
 * @param {any} state - Redux state
 * @returns
 */
export default function migrate(stateArg: unknown): unknown {
  const state = stateArg as MigrationState;
  const backgroundState = state.engine.backgroundState;

  const transactionControllerState = backgroundState.TransactionController;

  if (!transactionControllerState) return state;

  const transactions = transactionControllerState.transactions || [];
  const networkControllerState = backgroundState.NetworkController || {};
  const providerConfig = networkControllerState.providerConfig || {};

  const networkConfigurations =
    networkControllerState.networkConfigurations || {};

  const submitHistory = transactions
    .filter((tx: MigrationState) => tx.rawTransaction?.length)
    .map((tx: MigrationState) => {
      const matchingProviderConfig =
        providerConfig.chainId === tx.chainId ? providerConfig : undefined;

      const matchingNetworkConfigurations = Object.values(
        networkConfigurations,
      ).filter((c: unknown) => (c as MigrationState).chainId === tx.chainId);

      const networkUrl = matchingNetworkConfigurations.map((c: unknown) => (c as MigrationState).rpcUrl);

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
