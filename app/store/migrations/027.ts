import { NetworkType } from '@metamask/controller-utils';

/**
 * Populate the submitHistory in the TransactionController using any
 * transaction metadata entries that have a rawTransaction value.
 * @param {unknown} state - Redux state
 * @returns Migrated Redux state.
 */
export default function migrate(state: unknown) {
  const typedState = state as {
    engine: {
      backgroundState: {
        TransactionController?: {
          transactions?: {
            rawTransaction?: string;
            chainId?: string;
            transactionHash?: string;
            origin?: string;
            time?: number;
            transaction?: unknown;
            [key: string]: unknown;
          }[];
          submitHistory?: unknown[];
        };
        NetworkController?: {
          providerConfig?: {
            chainId?: string;
            type?: string;
          };
          networkConfigurations?: Record<
            string,
            { chainId?: string; rpcUrl?: string }
          >;
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

  const submitHistory = transactions
    .filter(
      (tx: { rawTransaction?: string }) => tx.rawTransaction?.length,
    )
    .map((tx: { rawTransaction?: string; chainId?: string; transactionHash?: string; origin?: string; time?: number; transaction?: unknown }) => {
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
