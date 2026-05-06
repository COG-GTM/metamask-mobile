import { isObject, hasProperty } from '@metamask/utils';
import { NetworkType } from '@metamask/controller-utils';

interface TransactionLike {
  rawTransaction?: string;
  chainId?: string;
  transactionHash?: string;
  origin?: string;
  time?: number;
  transaction?: unknown;
}

interface NetworkConfigurationLike {
  chainId?: string;
  rpcUrl?: string;
  [key: string]: unknown;
}

interface ProviderConfigLike {
  chainId?: string;
  type?: string;
  [key: string]: unknown;
}

/**
 * Populate the submitHistory in the TransactionController using any
 * transaction metadata entries that have a rawTransaction value.
 *
 * @param state - Redux state
 */
export default function migrate(state: unknown) {
  if (!isObject(state)) {
    return state;
  }
  if (!isObject(state.engine) || !isObject(state.engine.backgroundState)) {
    return state;
  }
  const backgroundState = state.engine.backgroundState;

  const transactionControllerState = backgroundState.TransactionController;

  if (!isObject(transactionControllerState)) return state;

  const transactions = (
    hasProperty(transactionControllerState, 'transactions') &&
    Array.isArray(transactionControllerState.transactions)
      ? transactionControllerState.transactions
      : []
  ) as TransactionLike[];
  const networkControllerState = isObject(backgroundState.NetworkController)
    ? backgroundState.NetworkController
    : {};
  const providerConfig = (
    hasProperty(networkControllerState, 'providerConfig') &&
    isObject(networkControllerState.providerConfig)
      ? networkControllerState.providerConfig
      : {}
  ) as ProviderConfigLike;

  const networkConfigurations = (
    hasProperty(networkControllerState, 'networkConfigurations') &&
    isObject(networkControllerState.networkConfigurations)
      ? networkControllerState.networkConfigurations
      : {}
  ) as Record<string, NetworkConfigurationLike>;

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
