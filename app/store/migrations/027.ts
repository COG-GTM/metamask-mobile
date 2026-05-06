import { NetworkType } from '@metamask/controller-utils';
import { isObject } from '@metamask/utils';

interface TransactionEntry {
  rawTransaction?: string;
  chainId?: string;
  transactionHash?: string;
  origin?: string;
  time?: number;
  transaction?: unknown;
  [key: string]: unknown;
}

interface NetworkConfiguration {
  chainId?: string;
  rpcUrl?: string;
  [key: string]: unknown;
}

interface ProviderConfig {
  chainId?: string;
  type?: string;
  [key: string]: unknown;
}

/**
 * Populate the submitHistory in the TransactionController using any
 * transaction metadata entries that have a rawTransaction value.
 * @param state - Redux state
 * @returns
 */
export default function migrate(state: unknown) {
  if (
    !isObject(state) ||
    !isObject(state.engine) ||
    !isObject(state.engine.backgroundState)
  ) {
    return state;
  }

  const backgroundState = state.engine.backgroundState;

  const transactionControllerState = backgroundState.TransactionController as
    | {
        transactions?: TransactionEntry[];
        submitHistory?: unknown[];
        [key: string]: unknown;
      }
    | undefined;

  if (!transactionControllerState) return state;

  const transactions = transactionControllerState.transactions || [];
  const networkControllerState = (backgroundState.NetworkController as
    | {
        providerConfig?: ProviderConfig;
        networkConfigurations?: Record<string, NetworkConfiguration>;
      }
    | undefined) || {};
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

  return state;
}
