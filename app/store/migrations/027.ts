import { NetworkType } from '@metamask/controller-utils';

interface LegacyTransactionMeta {
  chainId?: string;
  transactionHash?: string;
  origin?: string;
  time?: number;
  transaction?: unknown;
  rawTransaction?: string;
}

interface LegacyNetworkConfiguration {
  chainId?: string;
  rpcUrl?: string;
}

interface Migration027State {
  engine: {
    backgroundState: {
      TransactionController?: {
        transactions?: LegacyTransactionMeta[];
        submitHistory?: unknown[];
      };
      NetworkController?: {
        providerConfig?: { chainId?: string; type?: string };
        networkConfigurations?: Record<string, LegacyNetworkConfiguration>;
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
export default function migrate(incomingState: unknown) {
  const state = incomingState as Migration027State;
  const backgroundState = state.engine.backgroundState;

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

  transactionControllerState.submitHistory = submitHistory;

  return state;
}
