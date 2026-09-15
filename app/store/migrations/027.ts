import { NetworkType } from '@metamask/controller-utils';

interface LegacyTransactionMeta {
  chainId?: string;
  origin?: string;
  rawTransaction?: string;
  time?: number;
  transaction?: unknown;
  transactionHash?: string;
  [key: string]: unknown;
}

interface LegacyNetworkConfiguration {
  chainId?: string;
  rpcUrl?: string;
  [key: string]: unknown;
}

interface LegacyProviderConfig {
  chainId?: string;
  type?: string;
  [key: string]: unknown;
}

interface SubmitHistoryEntry {
  chainId?: string;
  hash?: string;
  migration: boolean;
  networkType?: string;
  networkUrl: (string | undefined)[];
  origin?: string;
  time?: number;
  transaction?: unknown;
  rawTransaction?: string;
}

interface MigrationState {
  engine: {
    backgroundState: {
      TransactionController?: {
        transactions?: LegacyTransactionMeta[];
        submitHistory?: SubmitHistoryEntry[];
        [key: string]: unknown;
      };
      NetworkController?: {
        providerConfig?: LegacyProviderConfig;
        networkConfigurations?: Record<string, LegacyNetworkConfiguration>;
        [key: string]: unknown;
      };
      [key: string]: unknown;
    };
  };
  [key: string]: unknown;
}

/**
 * Populate the submitHistory in the TransactionController using any
 * transaction metadata entries that have a rawTransaction value.
 * @param {unknown} stateUnknown - Redux state
 * @returns
 */
export default function migrate(stateUnknown: unknown) {
  const state = stateUnknown as MigrationState;
  const backgroundState = state.engine.backgroundState;

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

  transactionControllerState.submitHistory = submitHistory;

  return state;
}
