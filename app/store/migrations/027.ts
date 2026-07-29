import { NetworkType } from '@metamask/controller-utils';

interface TransactionMeta {
  chainId?: string;
  origin?: string;
  rawTransaction?: string;
  time?: number;
  transaction?: unknown;
  transactionHash?: string;
}

interface NetworkConfiguration {
  chainId?: string;
  rpcUrl?: string;
}

interface ProviderConfig {
  chainId?: string;
  type?: NetworkType;
}

interface TransactionControllerState {
  transactions?: TransactionMeta[];
  submitHistory?: unknown[];
}

/**
 * Shape of the persisted state this migration expects. Missing controllers are
 * handled with the same defaults the original implementation used.
 */
interface MigrationState {
  engine: {
    backgroundState: {
      TransactionController?: TransactionControllerState;
      NetworkController?: {
        providerConfig?: ProviderConfig;
        networkConfigurations?: Record<string, NetworkConfiguration>;
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
export default function migrate(state: unknown): Record<string, unknown> {
  const backgroundState = (state as MigrationState).engine.backgroundState;

  const transactionControllerState = backgroundState.TransactionController;

  if (!transactionControllerState) return state as Record<string, unknown>;

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

  return state as Record<string, unknown>;
}
