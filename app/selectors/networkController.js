
import { createSelector } from 'reselect';

import {




  RpcEndpointType } from
'@metamask/network-controller';

import { createDeepEqualSelector } from './util';
import { NETWORKS_CHAIN_ID } from '../constants/network';
import { selectTokenNetworkFilter } from './preferencesController';
import { enableAllNetworksFilter } from '../components/UI/Tokens/util/enableAllNetworksFilter';
import { PopularList } from '../util/networks/customNetworks';
import { CHAIN_IDS } from '@metamask/transaction-controller';
import {
  selectNonEvmNetworkConfigurationsByChainId,
  selectIsEvmNetworkSelected,
  selectSelectedNonEvmNetworkChainId,
  selectSelectedNonEvmNetworkSymbol } from
'./multichainNetworkController';








/**
 * A custom RPC endpoint is a reference to a user-defined server which fronts an
 * EVM chain. It may refer to an Infura network, but only by coincidence.
 */



















// Helper function to return the default provider config (mainnet)
const getDefaultProviderConfig = () => ({
  chainId: NETWORKS_CHAIN_ID.MAINNET,
  ticker: 'ETH',
  rpcPrefs: {},
  type: RpcEndpointType.Infura
});

const getProviderType = (rpcEndpoint) =>
rpcEndpoint.type === RpcEndpointType.Custom ?
'rpc' :
rpcEndpoint.networkClientId;

// Helper function to create the provider config based on the network and endpoint
export const createProviderConfig = (
networkConfig,
rpcEndpoint) =>
{
  const {
    chainId,
    nativeCurrency,
    name,
    blockExplorerUrls,
    defaultBlockExplorerUrlIndex
  } = networkConfig;
  const blockExplorerIndex = defaultBlockExplorerUrlIndex ?? 0;
  const blockExplorerUrl = blockExplorerUrls?.[blockExplorerIndex];

  return {
    chainId,
    ticker: nativeCurrency,
    rpcPrefs: { ...(blockExplorerUrl && { blockExplorerUrl }) },
    type: getProviderType(rpcEndpoint),
    ...(rpcEndpoint.type === RpcEndpointType.Custom && {
      id: rpcEndpoint.networkClientId,
      nickname: name,
      rpcUrl: rpcEndpoint.url
    })
  };
};

export const selectNetworkControllerState = (state) =>
state?.engine?.backgroundState?.NetworkController;

export const selectSelectedNetworkClientId = createSelector(
  selectNetworkControllerState,
  (networkControllerState) =>
  networkControllerState.selectedNetworkClientId
);

export const selectProviderConfig = createDeepEqualSelector(
  selectNetworkControllerState,
  (networkControllerState) => {
    const selectedNetworkClientId =
    networkControllerState?.selectedNetworkClientId;
    const networkConfigurationsByChainId =
    networkControllerState?.networkConfigurationsByChainId ?? {};

    if (!networkConfigurationsByChainId || !selectedNetworkClientId) {
      return getDefaultProviderConfig();
    }

    for (const networkConfig of Object.values(networkConfigurationsByChainId)) {
      const matchingRpcEndpoint = networkConfig.rpcEndpoints.find(
        (endpoint) => endpoint.networkClientId === selectedNetworkClientId
      );

      if (matchingRpcEndpoint) {
        return createProviderConfig(networkConfig, matchingRpcEndpoint);
      }
    }

    // Return default provider config (mainnet) if no matching network is found
    return getDefaultProviderConfig();
  }
);

export const selectEvmTicker = createDeepEqualSelector(
  selectProviderConfig,
  (providerConfig) => providerConfig?.ticker
);

export const selectTicker = createSelector(
  selectEvmTicker,
  selectSelectedNonEvmNetworkSymbol,
  selectIsEvmNetworkSelected,
  (evmTicker, nonEvmTicker, isEvmSelected) =>
  isEvmSelected ? evmTicker : nonEvmTicker
);

export const selectEvmChainId = createSelector(
  selectProviderConfig,
  (providerConfig) => providerConfig.chainId
);

export const selectChainId = createDeepEqualSelector(
  selectSelectedNonEvmNetworkChainId,
  selectEvmChainId,
  selectIsEvmNetworkSelected,
  (selectedNonEvmChainId, selectedEvmChainId, isEvmSelected) =>
  !isEvmSelected ? selectedNonEvmChainId : selectedEvmChainId
);

export const selectProviderType = createSelector(
  selectProviderConfig,
  (providerConfig) => providerConfig.type
);
export const selectNickname = createSelector(
  selectProviderConfig,
  (providerConfig) => providerConfig.nickname
);
export const selectRpcUrl = createSelector(
  selectProviderConfig,
  (providerConfig) => providerConfig.rpcUrl
);

export const selectNetworkStatus = createSelector(
  selectNetworkControllerState,
  (networkControllerState) =>
  networkControllerState?.networksMetadata[
  networkControllerState.selectedNetworkClientId].
  status
);

export const selectEvmNetworkConfigurationsByChainId = createSelector(
  selectNetworkControllerState,
  (networkControllerState) =>
  networkControllerState?.networkConfigurationsByChainId
);

export const selectNetworkConfigurations = createDeepEqualSelector(
  selectEvmNetworkConfigurationsByChainId,
  selectNonEvmNetworkConfigurationsByChainId,
  (
  evmNetworkConfigurationsByChainId,
  nonEvmNetworkConfigurationsByChainId) =>
  {
    const networkConfigurationsByChainId = {
      ...evmNetworkConfigurationsByChainId,
      ...nonEvmNetworkConfigurationsByChainId
    };
    return networkConfigurationsByChainId;
  }
);

export const selectNativeNetworkCurrencies = createDeepEqualSelector(
  selectNetworkConfigurations,
  (networkConfigurationsByChainId) => {
    const nativeCurrencies = [
    ...new Set(
      Object.values(networkConfigurationsByChainId).map(
        (n) => n.nativeCurrency
      )
    )];

    return nativeCurrencies;
  }
);

export const selectNetworkClientId = createSelector(
  selectNetworkControllerState,
  (networkControllerState) =>
  networkControllerState.selectedNetworkClientId
);

export const selectIsEIP1559Network = createSelector(
  selectNetworkControllerState,
  (networkControllerState) =>
  networkControllerState?.networksMetadata?.[
  networkControllerState.selectedNetworkClientId].
  EIPS[1559] === true
);

// Selector to get the popular network configurations, this filter also testnet networks
export const selectAllPopularNetworkConfigurations = createSelector(
  selectEvmNetworkConfigurationsByChainId,
  (networkConfigurations) => {
    const popularNetworksChainIds = PopularList.map(
      (popular) => popular.chainId
    );

    return Object.keys(networkConfigurations).
    filter(
      (chainId) =>
      popularNetworksChainIds.includes(chainId) ||
      chainId === CHAIN_IDS.MAINNET ||
      chainId === CHAIN_IDS.LINEA_MAINNET
    ).
    reduce((acc, chainId) => {
      acc[chainId] = networkConfigurations[chainId];
      return acc;
    }, {});
  }
);

export const selectIsPopularNetwork = createSelector(
  selectChainId,
  (chainId) =>
  chainId === CHAIN_IDS.MAINNET ||
  chainId === CHAIN_IDS.LINEA_MAINNET ||
  PopularList.some((network) => network.chainId === chainId)
);

export const selectIsAllNetworks = createSelector(
  selectAllPopularNetworkConfigurations,
  (state) => selectTokenNetworkFilter(state),
  (popularNetworkConfigurations, tokenNetworkFilter) => {
    if (Object.keys(tokenNetworkFilter).length === 1) {
      return false;
    }
    const allNetworks = enableAllNetworksFilter(popularNetworkConfigurations);
    return (
      Object.keys(tokenNetworkFilter).length === Object.keys(allNetworks).length);

  }
);

export const selectNetworkConfigurationByChainId = createSelector(
  [selectNetworkConfigurations, (_state, chainId) => chainId],
  (networkConfigurations, chainId) => networkConfigurations?.[chainId] || null
);

export const selectNativeCurrencyByChainId = createSelector(
  [
  selectEvmNetworkConfigurationsByChainId,
  (_state, chainId) => chainId],

  (networkConfigurations, chainId) =>
  networkConfigurations?.[chainId]?.nativeCurrency
);

export const selectDefaultEndpointByChainId = createSelector(
  selectEvmNetworkConfigurationsByChainId,
  (_, chainId) => chainId,
  (networkConfigurations, chainId) => {
    const networkConfiguration = networkConfigurations[chainId];
    return networkConfiguration?.rpcEndpoints?.[
    networkConfiguration.defaultRpcEndpointIndex];

  }
);

export const selectProviderTypeByChainId = createSelector(
  selectDefaultEndpointByChainId,
  (defaultEndpoint) =>
  defaultEndpoint ? getProviderType(defaultEndpoint) : undefined
);

export const selectRpcUrlByChainId = createSelector(
  selectDefaultEndpointByChainId,
  (defaultEndpoint) => defaultEndpoint?.url
);

export const checkNetworkAndAccountSupports1559 = createSelector(
  selectNetworkControllerState,
  (_state, networkClientId) => networkClientId,
  (networkControllerState, networkClientId) => {
    const selectedNetworkClientId =
    networkControllerState.selectedNetworkClientId;

    return (
      networkControllerState.networksMetadata?.[
      networkClientId ?? selectedNetworkClientId]?.
      EIPS[1559] === true);

  }
);