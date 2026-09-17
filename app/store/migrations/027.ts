import { NetworkType } from '@metamask/controller-utils';

interface Transaction {
  chainId?: string;
  transactionHash?: string;
  transaction?: unknown;
  origin?: string;
  time?: number;
  rawTransaction?: string;
}

interface ProviderConfig { chainId?: string; type?: string }
type NetworkConfigurations = Record<
  string,
  { chainId?: string; rpcUrl?: string }
>;

/**
 * Populate the submitHistory in the TransactionController using any
 * transaction metadata entries that have a rawTransaction value.
 * @param state - Redux state
 * @returns
 */
export default function migrate(state: unknown): Record<string, unknown> {
  const typedState = state as {
    engine: {
      backgroundState: {
        TransactionController?: {
          transactions?: Transaction[];
          submitHistory?: unknown;
        };
        NetworkController?: {
          providerConfig?: ProviderConfig;
          networkConfigurations?: NetworkConfigurations;
        };
      };
    };
  };
  const backgroundState = typedState.engine.backgroundState;

  const transactionControllerState = backgroundState.TransactionController;

  if (!transactionControllerState) return typedState;

  const transactions = transactionControllerState.transactions || [];
  const networkControllerState: {
    providerConfig?: ProviderConfig;
    networkConfigurations?: NetworkConfigurations;
  } = backgroundState.NetworkController || {};
  const providerConfig: ProviderConfig =
    networkControllerState.providerConfig || {};

  const networkConfigurations: NetworkConfigurations =
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

  return typedState;
}
