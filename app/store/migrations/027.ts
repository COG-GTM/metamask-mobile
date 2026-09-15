import { NetworkType } from '@metamask/controller-utils';

interface TransactionEntry {
  rawTransaction?: string;
  chainId?: string;
  transactionHash?: string;
  origin?: string;
  time?: number;
  transaction?: Record<string, unknown>;
}

interface NetworkConfig {
  chainId?: string;
  rpcUrl?: string;
}

interface ProviderConfig {
  chainId?: string;
  type?: string;
}

interface Migration27State {
  engine: {
    backgroundState: {
      TransactionController: {
        transactions?: TransactionEntry[];
        submitHistory?: unknown[];
      };
      NetworkController?: {
        providerConfig?: ProviderConfig;
        networkConfigurations?: Record<string, NetworkConfig>;
      };
    };
  };
}

/**
 * Populate the submitHistory in the TransactionController using any
 * transaction metadata entries that have a rawTransaction value.
 * @param {any} state - Redux state
 * @returns
 */
export default function migrate(state: unknown) {
  const typedState = state as Migration27State;
  const backgroundState = typedState.engine.backgroundState;

  const transactionControllerState = backgroundState.TransactionController;

  if (!transactionControllerState) return state;

  const transactions = transactionControllerState.transactions || [];
  const networkControllerState = backgroundState.NetworkController || {};
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

  typedState.engine.backgroundState.TransactionController.submitHistory =
    submitHistory;

  return state;
}
