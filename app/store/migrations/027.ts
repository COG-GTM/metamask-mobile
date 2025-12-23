import { isObject } from '@metamask/utils';
import { NetworkType } from '@metamask/controller-utils';

interface Transaction {
  rawTransaction?: string;
  chainId?: string;
  transactionHash?: string;
  origin?: string;
  time?: number;
  transaction?: unknown;
}

interface NetworkConfiguration {
  chainId?: string;
  rpcUrl?: string;
}

interface ProviderConfig {
  chainId?: string;
  type?: string;
}

interface SubmitHistoryEntry {
  chainId?: string;
  hash?: string;
  migration: boolean;
  networkType?: string;
  networkUrl: (string | undefined)[];
  origin?: string;
  time?: number;
  transaction?: unknown;
  rawTransaction?: string;
}

/**
 * Populate the submitHistory in the TransactionController using any
 * transaction metadata entries that have a rawTransaction value.
 * @param {any} state - Redux state
 * @returns
 */
export default function migrate(state: unknown): unknown {
  if (!isObject(state)) {
    return state;
  }

  if (!isObject(state.engine)) {
    return state;
  }

  if (!isObject(state.engine.backgroundState)) {
    return state;
  }

  const backgroundState = state.engine.backgroundState as Record<string, unknown>;

  const transactionControllerState = backgroundState.TransactionController as Record<string, unknown> | undefined;

  if (!transactionControllerState) return state;

  const transactions = (transactionControllerState.transactions as Transaction[]) || [];
  const networkControllerState = (backgroundState.NetworkController as Record<string, unknown>) || {};
  const providerConfig = (networkControllerState.providerConfig as ProviderConfig) || {};

  const networkConfigurations =
    (networkControllerState.networkConfigurations as Record<string, NetworkConfiguration>) || {};

  const submitHistory: SubmitHistoryEntry[] = transactions
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

  return state;
}
