import { NetworkType } from '@metamask/controller-utils';

interface Transaction {
  rawTransaction?: string;
  chainId?: unknown;
  transactionHash?: unknown;
  origin?: unknown;
  time?: unknown;
  transaction?: unknown;
  [key: string]: unknown;
}

interface ProviderConfig {
  chainId?: unknown;
  type?: unknown;
  [key: string]: unknown;
}

interface NetworkConfiguration {
  chainId?: unknown;
  rpcUrl?: unknown;
  [key: string]: unknown;
}

interface TransactionControllerState {
  transactions?: Transaction[];
  submitHistory?: unknown;
  [key: string]: unknown;
}

interface NetworkControllerState {
  providerConfig?: ProviderConfig;
  networkConfigurations?: Record<string, NetworkConfiguration>;
  [key: string]: unknown;
}

interface MigrationState {
  engine: {
    backgroundState: {
      TransactionController?: TransactionControllerState;
      NetworkController?: NetworkControllerState;
      [key: string]: unknown;
    };
  };
  [key: string]: unknown;
}

/**
 * Populate the submitHistory in the TransactionController using any
 * transaction metadata entries that have a rawTransaction value.
 * @param state - Redux state
 * @returns
 */
export default function migrate(state: unknown): Record<string, unknown> {
  const typedState = state as MigrationState;
  const backgroundState = typedState.engine.backgroundState;

  const transactionControllerState = backgroundState.TransactionController;

  if (!transactionControllerState)
    return typedState as unknown as Record<string, unknown>;

  const transactions = transactionControllerState.transactions || [];
  const networkControllerState: NetworkControllerState =
    backgroundState.NetworkController || {};
  const providerConfig: ProviderConfig =
    networkControllerState.providerConfig || {};

  const networkConfigurations: Record<string, NetworkConfiguration> =
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

  return typedState as unknown as Record<string, unknown>;
}
