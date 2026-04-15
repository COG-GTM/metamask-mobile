import { captureException } from '@sentry/react-native';
import { isObject, hasProperty } from '@metamask/utils';
import { CHAIN_IDS } from '@metamask/transaction-controller';





import { ensureValidState } from './util';


/**
 * This migration checks if `selectedNetworkClientId` exists in any entry within `networkConfigurationsByChainId`.
 * If it does not, or if `selectedNetworkClientId` is undefined or invalid, it sets `selectedNetworkClientId` to `'mainnet'`.
 * @param {unknown} stateAsync - Redux state.
 * @returns Migrated Redux state.
 */
export default async function migrate(stateAsync) {
  const migrationVersion = 64;
  const mainnetChainId = CHAIN_IDS.MAINNET;

  const state = await stateAsync;

  if (!ensureValidState(state, migrationVersion)) {
    return state;
  }

  const networkControllerState = state.engine.backgroundState.
  NetworkController;

  if (
  !isValidNetworkControllerState(
    networkControllerState,
    state,
    migrationVersion
  ))
  {
    return state;
  }

  const { networkConfigurationsByChainId, selectedNetworkClientId } =
  networkControllerState;

  const networkClientIdExists = doesNetworkClientIdExist(
    selectedNetworkClientId,
    networkConfigurationsByChainId,
    migrationVersion
  );

  const isMainnetRpcExists = isMainnetRpcConfigured(
    networkConfigurationsByChainId
  );

  ensureSelectedNetworkClientId(
    networkControllerState,
    networkClientIdExists,
    isMainnetRpcExists,
    networkConfigurationsByChainId,
    mainnetChainId
  );

  return state;
}

function isValidNetworkControllerState(
networkControllerState,
state,
migrationVersion)
{
  if (
  !isObject(networkControllerState) ||
  !hasProperty(state.engine.backgroundState, 'NetworkController'))
  {
    captureException(
      new Error(
        `Migration ${migrationVersion}: Invalid or missing 'NetworkController' in backgroundState: '${typeof networkControllerState}'`
      )
    );
    return false;
  }

  if (
  !hasProperty(networkControllerState, 'networkConfigurationsByChainId') ||
  !isObject(networkControllerState.networkConfigurationsByChainId))
  {
    captureException(
      new Error(
        `Migration ${migrationVersion}: Missing or invalid 'networkConfigurationsByChainId' in NetworkController`
      )
    );
    return false;
  }

  return true;
}

function doesNetworkClientIdExist(
selectedNetworkClientId,
networkConfigurationsByChainId,
migrationVersion)
{
  for (const chainId in networkConfigurationsByChainId) {
    const networkConfig = networkConfigurationsByChainId[chainId];

    if (
    isObject(networkConfig) &&
    hasProperty(networkConfig, 'rpcEndpoints') &&
    Array.isArray(networkConfig.rpcEndpoints))
    {
      if (
      networkConfig.rpcEndpoints.some(
        (endpoint) =>
        isObject(endpoint) &&
        hasProperty(endpoint, 'networkClientId') &&
        endpoint.networkClientId === selectedNetworkClientId
      ))
      {
        return true;
      }
    } else {
      captureException(
        new Error(
          `Migration ${migrationVersion}: Invalid network configuration or missing 'rpcEndpoints' for chainId: '${chainId}'`
        )
      );
    }
  }

  return false;
}

function isMainnetRpcConfigured(
networkConfigurationsByChainId)
{
  return Object.values(networkConfigurationsByChainId).some((networkConfig) =>
  networkConfig.rpcEndpoints.some(
    (endpoint) => endpoint.networkClientId === 'mainnet'
  )
  );
}

function ensureSelectedNetworkClientId(
networkControllerState,
networkClientIdExists,
isMainnetRpcExists,
networkConfigurationsByChainId,
mainnetChainId)
{
  const setDefaultMainnetClientId = () => {
    networkControllerState.selectedNetworkClientId = isMainnetRpcExists ?
    'mainnet' :
    networkConfigurationsByChainId[mainnetChainId].rpcEndpoints[
    networkConfigurationsByChainId[mainnetChainId].defaultRpcEndpointIndex].
    networkClientId;
  };

  if (
  !hasProperty(networkControllerState, 'selectedNetworkClientId') ||
  typeof networkControllerState.selectedNetworkClientId !== 'string')
  {
    setDefaultMainnetClientId();
  }

  if (!networkClientIdExists) {
    setDefaultMainnetClientId();
  }
}