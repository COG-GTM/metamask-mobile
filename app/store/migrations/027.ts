import { NetworkType } from '@metamask/controller-utils';

interface TransactionMeta {
  chainId?: string;
  origin?: string;
  rawTransaction?: string;
  time?: number;
  transaction?: Record<string, unknown>;
  transactionHash?: string;
  [key: string]: unknown;
}

interface NetworkConfiguration {
  chainId?: string;
  rpcUrl?: string;
  [key: string]: unknown;
}

/**
 * Subset of the persisted state read and written by this migration.
 */
interface MigrationState {
  engine: {
    backgroundState: {
      TransactionController?: {
        transactions?: TransactionMeta[];
        submitHistory?: unknown[];
        [key: string]: unknown;
      };
      NetworkController?: {
        providerConfig?: { chainId?: string; type?: string };
        networkConfigurations?: Record<string, NetworkConfiguration>;
        [key: string]: unknown;
      };
    };
  };
}

/**
 * Populate the submitHistory in the TransactionController using any
 * transaction metadata entries that have a rawTransaction value.
 *
 * @param state - Redux state
 * @returns Migrated Redux state
 */
export default function migrate(state: unknown) {
  const migratedState = state as MigrationState;
  const backgroundState = migratedState.engine.backgroundState;

  const transactionControllerState = backgroundState.TransactionController;

  if (!transactionControllerState) return migratedState;

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

  return migratedState;
}
