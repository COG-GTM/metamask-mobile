import { createSelector } from 'reselect';

import { getNativeTokenAddress } from '@metamask/assets-controllers';
import {
  selectSelectedInternalAccountFormattedAddress,
  selectSelectedInternalAccount,
  selectSelectedInternalAccountAddress } from
'../accountsController';
import { selectAllTokens } from '../tokensController';
import {
  selectAccountBalanceByChainId,
  selectAccountsByChainId } from
'../accountTrackerController';
import {
  selectChainId,
  selectEvmNetworkConfigurationsByChainId,
  selectEvmTicker,
  selectIsAllNetworks,
  selectIsPopularNetwork,
  selectNetworkConfigurations } from
'../networkController';

import { renderFromWei, weiToFiat } from '../../util/number';
import {
  hexToBN,
  toChecksumHexAddress,
  toHex } from
'@metamask/controller-utils';
import {
  selectConversionRate,
  selectCurrencyRates,
  selectCurrentCurrency } from
'../currencyRateController';
import { createDeepEqualSelector } from '../util';
import { getTicker } from '../../util/transactions';
import { zeroAddress } from 'ethereumjs-util';
import { selectHideZeroBalanceTokens } from '../settings';
import { selectTokensBalances } from '../tokenBalancesController';
import { isZero } from '../../util/lodash';
import { selectIsTokenNetworkFilterEqualCurrentNetwork } from '../preferencesController';
import { selectIsEvmNetworkSelected } from '../multichainNetworkController';
import { isTestNet } from '../../util/networks';
import { selectTokenMarketData } from '../tokenRatesController';
import { deriveBalanceFromAssetMarketDetails } from '../../components/UI/Tokens/util';

import { selectTokenList } from '../tokenListController';
import { safeToChecksumAddress, toFormattedAddress } from '../../util/address';










/**
 * Get the cached native token balance for the selected account by chainId.
 *
 * @param {RootState} state - The root state.
 * @returns {ChainBalances} The cached native token balance for the selected account by chainId.
 */
export const selectedAccountNativeTokenCachedBalanceByChainIdForAddress =
createSelector(
  [
  selectAccountsByChainId,
  (_, address) => address],

  (accountsByChainId, address) => {
    if (!accountsByChainId || !address) {
      return {};
    }

    const checksumAddress = toChecksumHexAddress(address);

    const result = {};
    for (const chainId in accountsByChainId) {
      const accounts = accountsByChainId[chainId];
      const account = accounts[checksumAddress];
      if (account) {
        result[chainId] = {
          balance: account.balance,
          stakedBalance: account.stakedBalance ?? '0x0',
          isStaked: account.stakedBalance !== '0x0',
          name: ''
        };
      }
    }

    return result;
  }
);

/**
 * Get the cached native token balance for the selected account by chainId.
 *
 * @param {RootState} state - The root state.
 * @returns {ChainBalances} The cached native token balance for the selected account by chainId.
 */
export const selectedAccountNativeTokenCachedBalanceByChainId = createSelector(
  [(state) => state, selectSelectedInternalAccountFormattedAddress],
  (state, selectedAddress) =>
  selectedAccountNativeTokenCachedBalanceByChainIdForAddress(
    state,
    selectedAddress
  )
);

/**
 * Selector to get native tokens for the selected account across all chains.
 */
export const selectNativeTokensAcrossChainsForAddress = createSelector(
  [
  selectEvmNetworkConfigurationsByChainId,
  (state, address) =>
  selectedAccountNativeTokenCachedBalanceByChainIdForAddress(
    state,
    address
  ),
  selectCurrencyRates,
  selectCurrentCurrency],

  (
  networkConfigurations,
  nativeTokenBalancesByChainId,
  currencyRates,
  currentCurrency) =>
  {
    const tokensByChain = {};
    for (const token of Object.values(networkConfigurations)) {
      const nativeChainId = token.chainId;
      const nativeTokenInfoByChainId =
      nativeTokenBalancesByChainId[nativeChainId];
      const isETH = [
      'ETH',
      'GOETH',
      'SepoliaETH',
      'LineaETH',
      'MegaETH'].
      includes(token.nativeCurrency || '');

      const name = isETH ? 'Ethereum' : token.nativeCurrency;
      const logo = isETH ? '../images/eth-logo-new.png' : '';
      tokensByChain[nativeChainId] = [];

      const nativeBalanceFormatted = renderFromWei(
        nativeTokenInfoByChainId?.balance
      );
      const stakedBalanceFormatted = renderFromWei(
        nativeTokenInfoByChainId?.stakedBalance
      );

      let balanceFiat = '';
      let stakedBalanceFiat = '';

      const conversionRate =
      currencyRates?.[token.nativeCurrency]?.conversionRate ?? 0;

      balanceFiat = weiToFiat(
        // TODO: Replace "any" with type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        hexToBN(nativeTokenInfoByChainId?.balance),
        conversionRate,
        currentCurrency
      );
      stakedBalanceFiat = weiToFiat(
        // TODO: Replace "any" with type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        hexToBN(nativeTokenInfoByChainId?.stakedBalance),
        conversionRate,
        currentCurrency
      );

      const tokenByChain = {
        ...nativeTokenInfoByChainId,
        name,
        address: getNativeTokenAddress(nativeChainId),
        balance: nativeBalanceFormatted,
        chainId: nativeChainId,
        isNative: true,
        aggregators: [],
        balanceFiat,
        image: '',
        logo,
        isETH,
        decimals: 18,
        symbol: name,
        isStaked: false,
        ticker: token.nativeCurrency
      };

      // Non-staked tokens
      tokensByChain[nativeChainId].push(tokenByChain);

      if (
      nativeTokenInfoByChainId &&
      nativeTokenInfoByChainId.isStaked &&
      nativeTokenInfoByChainId.stakedBalance !== '0x00' &&
      nativeTokenInfoByChainId.stakedBalance !== toHex(0))
      {
        // Staked tokens
        tokensByChain[nativeChainId].push({
          ...nativeTokenInfoByChainId,
          nativeAsset: tokenByChain,
          chainId: nativeChainId,
          address: getNativeTokenAddress(nativeChainId),
          balance: stakedBalanceFormatted,
          balanceFiat: stakedBalanceFiat,
          isNative: true,
          aggregators: [],
          image: '',
          logo,
          isETH,
          decimals: 18,
          name: 'Staked Ethereum',
          symbol: name,
          isStaked: true,
          ticker: token.nativeCurrency
        });
      }
    }

    return tokensByChain;
  }
);

/**
 * Selector to get native tokens for the selected account across all chains.
 */
export const selectNativeTokensAcrossChains = createSelector(
  [(state) => state, selectSelectedInternalAccountFormattedAddress],
  (state, selectedAddress) =>
  selectNativeTokensAcrossChainsForAddress(state, selectedAddress)
);

export const selectAccountTokensAcrossChainsForAddress =
createDeepEqualSelector(
  selectAllTokens,
  selectEvmNetworkConfigurationsByChainId,
  (state, address) =>
  selectNativeTokensAcrossChainsForAddress(state, address),
  (_, address) => address,
  (allTokens, networkConfigurations, nativeTokens, address) => {
    const tokensByChain =








    {};

    if (!address) {
      return tokensByChain;
    }

    // Create a list of available chainIds
    const chainIds = Object.keys(networkConfigurations);

    for (const chainId of chainIds) {
      const currentChainId = chainId;
      const nonNativeTokens =
      allTokens[currentChainId]?.[address]?.map((token) => ({
        ...token,
        token: token.name,
        chainId,
        isETH: false,
        isNative: false,
        balanceFiat: '',
        isStaked: false
      })) || [];

      // Add both native and non-native tokens
      tokensByChain[currentChainId] = [
      ...(nativeTokens[currentChainId] || []),
      ...nonNativeTokens];

    }

    return tokensByChain;
  }
);

/**
 * Get the tokens for the selected account across all chains.
 *
 * @param {RootState} state - The root state.
 * @returns {TokensByChain} The tokens for the selected account across all chains.
 */
export const selectAccountTokensAcrossChains = createSelector(
  (state) => state,
  selectSelectedInternalAccount,
  (state, selectedAccount) => {
    const selectedAddress = selectedAccount?.address;
    return selectAccountTokensAcrossChainsForAddress(state, selectedAddress);
  }
);

export const selectNativeEvmAsset = createDeepEqualSelector(
  selectAccountBalanceByChainId,
  selectEvmTicker,
  selectConversionRate,
  selectCurrentCurrency,
  (accountBalanceByChainId, ticker, conversionRate, currentCurrency) => {
    if (!accountBalanceByChainId) {
      return;
    }
    return {
      decimals: 18,
      name: getTicker(ticker) === 'ETH' ? 'Ethereum' : ticker,
      symbol: getTicker(ticker),
      isETH: true,
      balance: renderFromWei(accountBalanceByChainId.balance),
      balanceFiat: weiToFiat(
        // TODO: Replace "any" with type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        hexToBN(accountBalanceByChainId.balance),
        conversionRate,
        currentCurrency
      ),
      logo: '../images/eth-logo-new.png',
      address: zeroAddress()
    };
  }
);

export const selectStakedEvmAsset = createDeepEqualSelector(
  selectAccountBalanceByChainId,
  selectConversionRate,
  selectCurrentCurrency,
  selectNativeEvmAsset,
  (accountBalanceByChainId, conversionRate, currentCurrency, nativeAsset) => {
    if (!accountBalanceByChainId) {
      return;
    }
    if (!accountBalanceByChainId.stakedBalance) {
      return;
    }
    if (hexToBN(accountBalanceByChainId.stakedBalance).isZero()) {
      return;
    }
    if (!nativeAsset) {
      return;
    }
    return {
      ...nativeAsset,
      name: 'Staked Ethereum',
      isStaked: true,
      balance: renderFromWei(accountBalanceByChainId.stakedBalance),
      balanceFiat: weiToFiat(
        // TODO: Replace "any" with type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        hexToBN(accountBalanceByChainId.stakedBalance),
        conversionRate,
        currentCurrency
      )
    };
  }
);

export const selectEvmTokensWithZeroBalanceFilter = createDeepEqualSelector(
  selectHideZeroBalanceTokens,
  selectAccountTokensAcrossChains,
  selectTokensBalances,
  selectSelectedInternalAccountAddress,
  selectIsTokenNetworkFilterEqualCurrentNetwork,
  (
  hideZeroBalanceTokens,
  selectedAccountTokensChains,
  multiChainTokenBalance,
  selectedInternalAccountAddress,
  isUserOnCurrentNetwork) =>
  {
    const allTokens = Object.values(
      selectedAccountTokensChains
    ).flat();

    let tokensToDisplay = allTokens;

    // Respect zero balance filtering settings
    if (hideZeroBalanceTokens) {
      tokensToDisplay = allTokens.filter((token) => {
        const multiChainTokenBalances =
        multiChainTokenBalance?.[selectedInternalAccountAddress]?.[
        token.chainId];

        const balance =
        multiChainTokenBalances?.[token.address] || token.balance;

        return (
          !isZero(balance) ||
          isUserOnCurrentNetwork && (token.isNative || token.isStaked));

      });
    }
    return tokensToDisplay;
  }
);

export const selectEvmTokens = createDeepEqualSelector(
  selectEvmTokensWithZeroBalanceFilter,
  selectIsAllNetworks,
  selectIsPopularNetwork,
  selectIsEvmNetworkSelected,
  selectChainId,
  (
  tokensToDisplay,
  isAllNetworks,
  isPopularNetwork,
  isEvmSelected,
  currentChainId) =>
  {
    // Apply network filtering
    const filteredTokens =
    isAllNetworks && isPopularNetwork && isEvmSelected ?
    tokensToDisplay :
    tokensToDisplay.filter((token) => token.chainId === currentChainId);

    // Categorize tokens as native or non-native, filtering out testnet tokens if applicable
    const nativeTokens = [];
    const nonNativeTokens = [];

    for (const currToken of filteredTokens) {
      const token = currToken;

      // Skip tokens if they are on a test network and the current chain is not a test network
      if (isTestNet(token.chainId) && !isTestNet(currentChainId)) {
        continue;
      }

      // Categorize tokens as native or non-native
      if (token.isNative) {
        nativeTokens.push(token);
      } else {
        nonNativeTokens.push(token);
      }
    }

    return [...nativeTokens, ...nonNativeTokens];
  }
);

export const selectEvmTokenFiatBalances = createDeepEqualSelector(
  selectEvmTokens,
  selectTokenMarketData,
  selectTokensBalances,
  selectSelectedInternalAccountAddress,
  selectNetworkConfigurations,
  selectCurrencyRates,
  selectCurrentCurrency,
  (
  evmTokens,
  multiChainMarketData,
  multiChainTokenBalance,
  selectedInternalAccountAddress,
  networkConfigurationsByChainId,
  multiChainCurrencyRates,
  currentCurrency) =>

  evmTokens.map((token) => {
    const chainId = token.chainId;
    const multiChainExchangeRates = multiChainMarketData?.[chainId];
    const multiChainTokenBalances =
    multiChainTokenBalance?.[selectedInternalAccountAddress]?.[
    chainId];

    const nativeCurrency =
    networkConfigurationsByChainId[chainId].nativeCurrency;
    const multiChainConversionRate =
    multiChainCurrencyRates?.[nativeCurrency]?.conversionRate || 0;

    return token.isETH || token.isNative ?
    parseFloat(token.balance) * multiChainConversionRate :
    deriveBalanceFromAssetMarketDetails(
      token,
      multiChainExchangeRates || {},
      multiChainTokenBalances || {},
      multiChainConversionRate || 0,
      currentCurrency || ''
    ).balanceFiatCalculation;
  })
);

export const selectEvmTokenMarketData = createDeepEqualSelector(
  [
  selectTokenList,
  selectTokenMarketData,
  (_state, params) =>
  params.chainId,
  (_state, params) =>
  params.tokenAddress],

  (tokenList, marketData, chainId, tokenAddress) => {
    // Handle native token case (no address)
    if (!tokenAddress) {
      return marketData?.[chainId]?.[zeroAddress()];
    }

    // Get checksummed address
    const checksumAddress = safeToChecksumAddress(tokenAddress);
    if (!checksumAddress) return null;

    // Get token metadata and market data
    const tokenMetadata = tokenList?.[checksumAddress.toLowerCase()];
    const tokenMarketData = marketData?.[chainId]?.[checksumAddress];

    return {
      metadata: tokenMetadata,
      marketData: tokenMarketData
    };
  }
);

/**
 * Creates a selector that finds a specific asset (token) by its address and chain ID.
 * This selector is particularly important for handling both native and staked assets
 * that may share the same address (e.g., 0x00) on the same chain.
 *
 * The selector uses a three-level nested map structure for efficient lookups:
 * 1. First level: chainId -> Map
 * 2. Second level: address -> Map
 * 3. Third level: isStaked (boolean) -> TokenI
 *
 * This structure allows us to:
 * - Efficiently look up tokens by chainId and address
 * - Properly distinguish between staked and non-staked assets that share the same address
 * - Handle native tokens (address: 0x00) correctly
 *
 * @example
 * // For native asset
 * const nativeAsset = selectAssetByAddressAndChainId(state, {
 *   address: '0x00',
 *   chainId: '0x1',
 *   isStaked: false
 * });
 *
 * // For staked asset
 * const stakedAsset = selectAssetByAddressAndChainId(state, {
 *   address: '0x00',
 *   chainId: '0x1',
 *   isStaked: true
 * });
 *
 * @returns A selector function that returns the matching TokenI or undefined if not found
 */
export const makeSelectAssetByAddressAndChainId = () =>
createSelector(
  [
  selectEvmTokens, // TokenI[]
  selectIsEvmNetworkSelected,
  (
  _state,
  params) =>
  toFormattedAddress(params.address),
  (
  _state,
  params) =>
  params.chainId,
  (
  _state,
  params) =>
  params.isStaked],

  (
  tokens,
  isEvmNetworkSelected,
  address,
  chainId,
  isStaked) =>
  {
    if (!isEvmNetworkSelected) {
      return undefined;
    }
    // Step 1: build nested map once per call
    const lookup = new Map();

    for (const token of tokens) {
      if (!token.chainId || !token.address) {
        continue; // skip invalid tokens
      }

      const tokenChainId = token.chainId;
      const tokenAddress = toFormattedAddress(token.address);
      const tokenIsStaked = Boolean(token.isStaked); // this is important in order to differentiate between staked and non-staked tokens on the same chain

      if (!lookup.has(tokenChainId)) {
        lookup.set(tokenChainId, new Map());
      }
      const chainMap = lookup.get(tokenChainId);

      if (chainMap && !chainMap.has(tokenAddress)) {
        chainMap.set(tokenAddress, new Map());
      }
      const addressMap = chainMap?.get(tokenAddress);

      if (addressMap) {
        addressMap.set(tokenIsStaked, token);
      }
    }

    // Step 2: lookup
    const token = lookup.
    get(chainId)?.
    get(address)?.
    get(Boolean(isStaked));

    return token;
  }
);