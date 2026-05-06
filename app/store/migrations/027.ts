import { NetworkType } from '@metamask/controller-utils';

interface TransactionEntry {
  rawTransaction?: string;
  chainId?: string;
  transactionHash?: string;
  transaction?: unknown;
  origin?: string;
  time?: number;
  [key: string]: unknown;
}

interface NetworkConfigurationEntry {
  chainId?: string;
  rpcUrl?: string;
  [key: string]: unknown;
}

interface ProviderConfigEntry {
  chainId?: string;
  type?: NetworkType;
  [key: string]: unknown;
}

/**
 * Populate the submitHistory in the TransactionController using any
 * transaction metadata entries that have a rawTransaction value.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function migrate(state: any) {
  const backgroundState = state.engine.backgroundState;

  const transactionControllerState = backgroundState.TransactionController;

  if (!transactionControllerState) return state;

  const transactions: TransactionEntry[] =
    transactionControllerState.transactions || [];
  const networkControllerState = backgroundState.NetworkController || {};
  const providerConfig: ProviderConfigEntry =
    networkControllerState.providerConfig || {};

  const networkConfigurations: Record<string, NetworkConfigurationEntry> =
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

  state.engine.backgroundState.TransactionController.submitHistory =
    submitHistory;

  return state;
}
