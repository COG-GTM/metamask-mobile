import { NetworkType } from '@metamask/controller-utils';
import { TransactionParams } from '@metamask/transaction-controller';

interface Migration27Transaction {
  chainId?: string;
  origin?: string;
  rawTransaction?: string;
  time?: number;
  transaction?: TransactionParams;
  transactionHash?: string;
}

interface Migration27ProviderConfig {
  chainId?: string;
  type?: NetworkType;
}

interface Migration27NetworkConfiguration {
  chainId?: string;
  rpcUrl?: string;
}

interface Migration27NetworkControllerState {
  providerConfig?: Migration27ProviderConfig;
  networkConfigurations?: Record<string, Migration27NetworkConfiguration>;
}

interface Migration27State {
  engine: {
    backgroundState: {
      TransactionController?: {
        transactions?: Migration27Transaction[];
        submitHistory?: unknown;
      };
      NetworkController?: Migration27NetworkControllerState;
    };
  };
}

/**
 * Populate the submitHistory in the TransactionController using any
 * transaction metadata entries that have a rawTransaction value.
 * @param rawState - Redux state
 * @returns
 */
export default function migrate(rawState: unknown) {
  const state = rawState as Migration27State;
  const backgroundState = state.engine.backgroundState;

  const transactionControllerState = backgroundState.TransactionController;

  if (!transactionControllerState) return state;

  const transactions = transactionControllerState.transactions || [];
  const networkControllerState: Migration27NetworkControllerState =
    backgroundState.NetworkController || {};
  const providerConfig: Migration27ProviderConfig =
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

  return state;
}
