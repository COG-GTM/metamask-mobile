import { NetworkType } from '@metamask/controller-utils';

interface Migration027Transaction {
  chainId?: string;
  origin?: string;
  rawTransaction?: string;
  time?: number;
  transaction?: unknown;
  transactionHash?: string;
}

interface Migration027NetworkConfiguration {
  chainId?: string;
  rpcUrl?: string;
}

interface Migration027ProviderConfig {
  chainId?: string;
  type?: string;
}

interface Migration027State {
  engine: {
    backgroundState: {
      TransactionController?: {
        transactions?: Migration027Transaction[];
        submitHistory?: unknown[];
      };
      NetworkController?: {
        providerConfig?: Migration027ProviderConfig;
        networkConfigurations?: Record<
          string,
          Migration027NetworkConfiguration
        >;
      };
    };
  };
}

/**
 * Populate the submitHistory in the TransactionController using any
 * transaction metadata entries that have a rawTransaction value.
 * @param state - Redux state
 * @returns
 */
export default function migrate(state: unknown) {
  const migratedState = state as Migration027State;
  const backgroundState = migratedState.engine.backgroundState;

  const transactionControllerState = backgroundState.TransactionController;

  if (!transactionControllerState) return migratedState;

  const transactions = transactionControllerState.transactions || [];
  const networkControllerState = backgroundState.NetworkController || {};
  const providerConfig: Migration027ProviderConfig =
    networkControllerState.providerConfig || {};

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

  return migratedState;
}
