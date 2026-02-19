import { NetworkType } from '@metamask/controller-utils';

interface Transaction {
  rawTransaction?: string;
  chainId?: string;
  transactionHash?: string;
  origin?: string;
  time?: number;
  transaction?: unknown;
  [key: string]: unknown;
}

interface NetworkConfiguration {
  chainId: string;
  rpcUrl: string;
  [key: string]: unknown;
}

interface MigrationState {
  engine: {
    backgroundState: {
      TransactionController: {
        transactions?: Transaction[];
        submitHistory?: unknown[];
        [key: string]: unknown;
      };
      NetworkController: {
        providerConfig?: {
          chainId?: string;
          type?: string;
          [key: string]: unknown;
        };
        networkConfigurations?: Record<string, NetworkConfiguration>;
        [key: string]: unknown;
      };
    };
  };
}

export default function migrate(state: unknown): unknown {
  const s = state as MigrationState;
  const backgroundState = s.engine.backgroundState;

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

  s.engine.backgroundState.TransactionController.submitHistory =
    submitHistory;

  return state;
}
