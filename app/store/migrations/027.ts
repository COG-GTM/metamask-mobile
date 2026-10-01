import { NetworkType } from '@metamask/controller-utils';

interface TransactionMeta {
  rawTransaction?: string;
  chainId?: string;
  transactionHash?: string;
  transaction?: unknown;
  time?: number;
  origin?: string;
  [key: string]: unknown;
}

interface NetworkConfiguration {
  chainId?: string;
  rpcUrl?: string;
  [key: string]: unknown;
}

interface ProviderConfig {
  chainId?: string;
  type?: NetworkType;
  [key: string]: unknown;
}

/**
 * Populate the submitHistory in the TransactionController using any
 * transaction metadata entries that have a rawTransaction value.
 * @param state - Redux state
 * @returns
 */
export default function migrate(state: unknown) {
  const typedState = state as {
    engine: {
      backgroundState: {
        TransactionController?: {
          transactions?: TransactionMeta[];
          submitHistory?: unknown;
        };
        NetworkController?: {
          providerConfig?: ProviderConfig;
          networkConfigurations?: Record<string, NetworkConfiguration>;
        };
      };
    };
  };
  const backgroundState = typedState.engine.backgroundState;

  const transactionControllerState = backgroundState.TransactionController;

  if (!transactionControllerState) return state;

  const transactions = transactionControllerState.transactions || [];
  const networkControllerState = backgroundState.NetworkController;
  const providerConfig: ProviderConfig =
    networkControllerState?.providerConfig || {};

  const networkConfigurations: Record<string, NetworkConfiguration> =
    networkControllerState?.networkConfigurations || {};

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
