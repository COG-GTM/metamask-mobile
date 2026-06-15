import { NetworkType } from '@metamask/controller-utils';

interface Migration27Transaction {
  rawTransaction?: { length?: number };
  chainId?: unknown;
  transactionHash?: unknown;
  origin?: unknown;
  time?: unknown;
  transaction?: unknown;
}

interface Migration27NetworkConfig {
  chainId?: unknown;
  rpcUrl?: unknown;
}

interface Migration27State {
  engine: {
    backgroundState: {
      TransactionController: {
        transactions?: Migration27Transaction[];
        submitHistory?: unknown;
      };
      NetworkController?: {
        providerConfig?: { chainId?: unknown; type?: unknown };
        networkConfigurations?: Record<string, Migration27NetworkConfig>;
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

  if (!transactionControllerState) return typedState;

  const transactions = transactionControllerState.transactions || [];
  const networkControllerState: {
    providerConfig?: { chainId?: unknown; type?: unknown };
    networkConfigurations?: Record<string, Migration27NetworkConfig>;
  } = backgroundState.NetworkController || {};
  const providerConfig: { chainId?: unknown; type?: unknown } =
    networkControllerState.providerConfig || {};

  const networkConfigurations: Record<string, Migration27NetworkConfig> =
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

  return typedState;
}
