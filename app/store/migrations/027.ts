import { NetworkType } from '@metamask/controller-utils';

interface LegacyTransaction {
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

interface LegacySubmitHistoryEntry {
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

interface LegacyState {
  engine: {
    backgroundState: {
      TransactionController?: {
        transactions?: LegacyTransaction[];
        submitHistory?: LegacySubmitHistoryEntry[];
        [key: string]: unknown;
      };
      NetworkController?: {
        providerConfig?: LegacyProviderConfig;
        networkConfigurations?: Record<string, LegacyNetworkConfiguration>;
        [key: string]: unknown;
      };
    };
  };
}

/**
 * Populate the submitHistory in the TransactionController using any
 * transaction metadata entries that have a rawTransaction value.
 * @param {unknown} state - Redux state
 * @returns
 */
export default function migrate(stateArg: unknown) {
  const state = stateArg as LegacyState;
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
