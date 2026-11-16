import { captureException } from '@sentry/react-native';
import { isObject, hasProperty, Hex } from '@metamask/utils';
import { CHAIN_IDS } from '@metamask/transaction-controller';
import {
  NetworkClientId,
  NetworkConfiguration,
  NetworkState,
} from '@metamask/network-controller';
import { ensureValidState } from './util';
import { RootState } from '../../reducers';

/**
 * This migration checks if `selectedNetworkClientId` exists in any entry within `networkConfigurationsByChainId`.
 * If it does not, or if `selectedNetworkClientId` is undefined or invalid, it sets `selectedNetworkClientId` to `'mainnet'`.
 * @param {unknown} stateAsync - Redux state.
 * @returns Migrated Redux state.
 */
export default async function migrate(stateAsync: unknown) {
  const migrationVersion = 64;
  const mainnetChainId = CHAIN_IDS.MAINNET;

  const state = await stateAsync;

  if (!ensureValidState(state, migrationVersion)) {
    return state;
  }

  const networkControllerState = state.engine.backgroundState
    .NetworkController as NetworkState;

  if (
    !isValidNetworkControllerState(
      networkControllerState,
      state as RootState,
      migrationVersion,
    )
  ) {
    return state;
  }

  const { networkConfigurationsByChainId, selectedNetworkClientId } =
    networkControllerState;

  const networkClientIdExists = doesNetworkClientIdExist(
    selectedNetworkClientId,
    networkConfigurationsByChainId,
    migrationVersion,
  );

  const isMainnetRpcExists = isMainnetRpcConfigured(
    networkConfigurationsByChainId,
  );

  ensureSelectedNetworkClientId(
    networkControllerState,
    networkClientIdExists,
    isMainnetRpcExists,
    networkConfigurationsByChainId,
    mainnetChainId,
    migrationVersion,
  );

  return state;
}

function isValidNetworkControllerState(
  networkControllerState: NetworkState,
  state: RootState,
  migrationVersion: number,
) {
  if (
    !isObject(networkControllerState) ||
    !hasProperty(state.engine.backgroundState, 'NetworkController')
  ) {
    captureException(
      new Error(
        `Migration ${migrationVersion}: Invalid or missing 'NetworkController' in backgroundState: '${typeof networkControllerState}'`,
      ),
    );
    return false;
  }

  if (
    !hasProperty(networkControllerState, 'networkConfigurationsByChainId') ||
    !isObject(networkControllerState.networkConfigurationsByChainId)
  ) {
    captureException(
      new Error(
        `Migration ${migrationVersion}: Missing or invalid 'networkConfigurationsByChainId' in NetworkController`,
      ),
    );
    return false;
  }

  return true;
}

function doesNetworkClientIdExist(
  selectedNetworkClientId: NetworkClientId,
  networkConfigurationsByChainId: Record<Hex, NetworkConfiguration>,
  migrationVersion: number,
) {
  for (const chainId in networkConfigurationsByChainId) {
    const networkConfig = networkConfigurationsByChainId[chainId as Hex];

    if (
      isObject(networkConfig) &&
      hasProperty(networkConfig, 'rpcEndpoints') &&
      Array.isArray(networkConfig.rpcEndpoints)
    ) {
      if (
        networkConfig.rpcEndpoints.some(
          (endpoint) =>
            isObject(endpoint) &&
            hasProperty(endpoint, 'networkClientId') &&
            endpoint.networkClientId === selectedNetworkClientId,
        )
      ) {
        return true;
      }
    } else {
      captureException(
        new Error(
          `Migration ${migrationVersion}: Invalid network configuration or missing 'rpcEndpoints' for chainId: '${chainId}'`,
        ),
      );
    }
  }

  return false;
}

function isMainnetRpcConfigured(
  networkConfigurationsByChainId: Record<Hex, NetworkConfiguration>,
) {
  return Object.values(networkConfigurationsByChainId).some(
    (networkConfig) =>
      isObject(networkConfig) &&
      Array.isArray(networkConfig.rpcEndpoints) &&
      networkConfig.rpcEndpoints.some(
        (endpoint) =>
          isObject(endpoint) && endpoint.networkClientId === 'mainnet',
      ),
  );
}

function ensureSelectedNetworkClientId(
  networkControllerState: NetworkState,
  networkClientIdExists: boolean,
  isMainnetRpcExists: boolean,
  networkConfigurationsByChainId: Record<Hex, NetworkConfiguration>,
  mainnetChainId: Hex,
  migrationVersion: number,
) {
  const getDefaultMainnetClientId = (): NetworkClientId => {
    if (isMainnetRpcExists) {
      return 'mainnet';
    }

    const mainnetConfig = networkConfigurationsByChainId[mainnetChainId];
    const defaultEndpoint =
      isObject(mainnetConfig) && Array.isArray(mainnetConfig.rpcEndpoints)
        ? mainnetConfig.rpcEndpoints[mainnetConfig.defaultRpcEndpointIndex]
        : undefined;

    if (
      isObject(defaultEndpoint) &&
      typeof defaultEndpoint.networkClientId === 'string'
    ) {
      return defaultEndpoint.networkClientId;
    }

    captureException(
      new Error(
        `Migration ${migrationVersion}: Missing or invalid mainnet ('${mainnetChainId}') network configuration, falling back to 'mainnet'`,
      ),
    );
    return 'mainnet';
  };

  const setDefaultMainnetClientId = () => {
    networkControllerState.selectedNetworkClientId =
      getDefaultMainnetClientId();
  };

  if (
    !hasProperty(networkControllerState, 'selectedNetworkClientId') ||
    typeof networkControllerState.selectedNetworkClientId !== 'string'
  ) {
    setDefaultMainnetClientId();
  }

  if (!networkClientIdExists) {
    setDefaultMainnetClientId();
  }
}
