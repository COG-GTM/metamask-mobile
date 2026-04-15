
import { createSelector } from 'reselect';


import { createDeepEqualSelector } from './util';
import { selectSelectedInternalAccountAddress } from './accountsController';
import { isPortfolioViewEnabled } from '../util/networks';
import {
  selectEvmChainId,
  selectEvmNetworkConfigurationsByChainId,
  selectIsAllNetworks,
  selectIsPopularNetwork } from
'./networkController';
import { PopularList } from '../util/networks/customNetworks';
import { ChainId } from '@metamask/controller-utils';

const selectTokensControllerState = (state) =>
state?.engine?.backgroundState?.TokensController;

export const selectTokens = createDeepEqualSelector(
  selectTokensControllerState,
  selectEvmChainId,
  selectSelectedInternalAccountAddress,
  (
  tokensControllerState,
  chainId,
  selectedAddress) =>

  tokensControllerState?.allTokens[chainId]?.[selectedAddress] || []
);

export const selectTokensByChainIdAndAddress = createDeepEqualSelector(
  selectTokensControllerState,
  selectEvmChainId,
  selectSelectedInternalAccountAddress,
  (
  tokensControllerState,
  chainId,
  selectedAddress) =>
  tokensControllerState?.allTokens[chainId]?.[selectedAddress]
);

export const selectTokensByAddress = createSelector(
  selectTokens,
  (tokens) =>
  tokens?.reduce((tokensMap, token) => {
    tokensMap[token.address] = token;
    return tokensMap;
  }, {})
);

export const selectTokensLength = createSelector(
  selectTokens,
  (tokens) => tokens.length
);

export const selectIgnoreTokens = createSelector(
  selectTokensControllerState,
  selectEvmChainId,
  selectSelectedInternalAccountAddress,
  (
  tokensControllerState,
  chainId,
  selectedAddress) =>

  tokensControllerState?.allIgnoredTokens?.[chainId]?.[
  selectedAddress]

);

export const selectDetectedTokens = createSelector(
  selectTokensControllerState,
  selectEvmChainId,
  selectSelectedInternalAccountAddress,
  (
  tokensControllerState,
  chainId,
  selectedAddress) =>

  tokensControllerState?.allDetectedTokens?.[chainId]?.[
  selectedAddress]

);

export const selectAllTokens = createDeepEqualSelector(
  selectTokensControllerState,
  (tokensControllerState) =>
  tokensControllerState?.allTokens
);

export const getChainIdsToPoll = createDeepEqualSelector(
  selectEvmNetworkConfigurationsByChainId,
  selectEvmChainId,
  (networkConfigurations, currentChainId) => {
    if (!isPortfolioViewEnabled()) {
      return [currentChainId];
    }

    const popularNetworksChainIds = PopularList.map(
      (popular) => popular.chainId
    );
    return Object.keys(networkConfigurations).filter(
      (chainId) =>
      chainId === currentChainId ||
      chainId === ChainId.mainnet ||
      chainId === ChainId['linea-mainnet'] ||
      popularNetworksChainIds.includes(chainId)
    );
  }
);

export const selectAllTokensFlat = createSelector(
  selectAllTokens,
  (tokensByAccountByChain) =>

  {
    if (Object.values(tokensByAccountByChain).length === 0) {
      return [];
    }
    const tokensByAccountArray = Object.values(tokensByAccountByChain);

    return tokensByAccountArray.reduce((acc, tokensByAccount) => {
      const tokensArray = Object.values(tokensByAccount).flat();
      return acc.concat(...tokensArray);
    }, []);
  }
);

export const selectAllDetectedTokensForSelectedAddress = createSelector(
  selectTokensControllerState,
  selectSelectedInternalAccountAddress,
  (tokensControllerState, selectedAddress) => {
    // Updated return type to specify the structure more clearly
    if (!selectedAddress) {
      return {}; // Specify return type
    }

    return Object.entries(
      tokensControllerState?.allDetectedTokens || {}
    ).reduce(

      (acc, [chainId, chainTokens]) => {
        const tokensForAddress = chainTokens[selectedAddress] || [];
        if (tokensForAddress.length > 0) {
          acc[chainId] = tokensForAddress.map((token) => ({
            ...token,
            chainId
          }));
        }
        return acc;
      }, {});
  }
);

export const selectAllDetectedTokensFlat = createSelector(
  selectAllDetectedTokensForSelectedAddress,
  (detectedTokensByChain) => {
    if (Object.keys(detectedTokensByChain).length === 0) {
      return [];
    }

    const flattenedTokens = [];

    for (const [chainId, addressTokens] of Object.entries(
      detectedTokensByChain
    )) {
      for (const token of addressTokens) {
        flattenedTokens.push({
          ...token,
          chainId: chainId
        });
      }
    }

    return flattenedTokens;
  }
);

// Full selector implementation with selected address filtering
export const selectTransformedTokens = createSelector(
  selectAllTokens,
  selectSelectedInternalAccountAddress,
  selectEvmChainId,
  selectIsAllNetworks,
  selectIsPopularNetwork,
  (
  allTokens,
  selectedAddress,
  networkId,
  isAllNetworks,
  isPopularNetwork) =>
  {
    if (!isAllNetworks || !isPopularNetwork) {
      return allTokens[networkId]?.[selectedAddress];
    }

    // Filter for the selected address and transform
    const flatList = Object.entries(allTokens).flatMap(
      ([chainId, addresses]) => {
        if (selectedAddress && addresses[selectedAddress]) {
          return addresses[selectedAddress].map((token) => ({
            ...token,
            chainId, // Add chainId to the token property
            address: selectedAddress // Add the selected address as a property
          }));
        }
        return [];
      }
    );

    return flatList;
  }
);