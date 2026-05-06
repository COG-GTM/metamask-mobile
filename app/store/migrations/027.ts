import { NetworkType } from '@metamask/controller-utils';

interface TxMeta {
  chainId?: string;
  origin?: string;
  time?: number;
  transaction?: unknown;
  transactionHash?: string;
  rawTransaction?: string;
  [key: string]: unknown;
}

interface NetworkConfig {
  chainId?: string;
  rpcUrl?: string;
  [key: string]: unknown;
}

interface SubmitHistoryEntry {
  chainId?: string;
  hash?: string;
  migration: true;
  networkType?: NetworkType;
  networkUrl: (string | undefined)[];
  origin?: string;
  time?: number;
  transaction?: unknown;
  rawTransaction?: string;
}

/**
 * Populate the submitHistory in the TransactionController using any
 * transaction metadata entries that have a rawTransaction value.
 * @param state - Redux state
 * @returns
 */
export default function migrate(state: unknown): unknown {
  const typedState = state as {
    engine: {
      backgroundState: {
        TransactionController?: {
          transactions?: TxMeta[];
          submitHistory?: SubmitHistoryEntry[];
          [key: string]: unknown;
        };
        NetworkController?: {
          providerConfig?: { chainId?: string; type?: NetworkType };
          networkConfigurations?: Record<string, NetworkConfig>;
          [key: string]: unknown;
        };
      };
    };
  };
  const backgroundState = typedState.engine.backgroundState;

  const transactionControllerState = backgroundState.TransactionController;

  if (!transactionControllerState) return state;

  const transactions = transactionControllerState.transactions || [];
  const networkControllerState = backgroundState.NetworkController || {};
  const providerConfig = networkControllerState.providerConfig || {};

  const networkConfigurations =
    networkControllerState.networkConfigurations || {};

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

  if (typedState.engine.backgroundState.TransactionController) {
    typedState.engine.backgroundState.TransactionController.submitHistory =
      submitHistory;
  }

  return state;
}
