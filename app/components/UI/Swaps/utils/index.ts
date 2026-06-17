import { useMemo } from 'react';
import BigNumber from 'bignumber.js';
import { swapsUtils } from '@metamask/swaps-controller';
import { Hex } from '@metamask/utils';
import { strings } from '../../../../../locales/i18n';
import AppConstants from '../../../../core/AppConstants';
import { NETWORKS_CHAIN_ID } from '../../../../constants/network';
///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
import { SolScope } from '@metamask/keyring-api';
///: END:ONLY_INCLUDE_IF(keyring-snaps)

export interface SwapsToken {
  address?: string;
  symbol?: string | null;
  decimals?: number;
  occurrences?: number;
  aggregators?: string[];
  name?: string;
  iconUrl?: string;
  type?: string;
}

export interface SwapsRouteParams {
  slippage?: number;
  sourceTokenAddress?: string;
  destinationTokenAddress?: string;
  sourceAmount?: string;
  tokens?: SwapsToken[];
}

export interface SwapsRoute {
  params?: SwapsRouteParams;
}

export interface GetFetchParamsOptions {
  slippage?: string | number;
  sourceToken: SwapsToken;
  destinationToken: SwapsToken;
  sourceAmount?: string;
  walletAddress?: string;
  networkClientId?: string;
  enableGasIncludedQuotes?: boolean;
}

export interface ShouldShowMaxBalanceLinkOptions {
  sourceToken?: SwapsToken;
  shouldUseSmartTransaction: boolean;
  hasBalance: boolean;
}

const {
  ETH_CHAIN_ID,
  BSC_CHAIN_ID,
  SWAPS_TESTNET_CHAIN_ID,
  POLYGON_CHAIN_ID,
  AVALANCHE_CHAIN_ID,
  ARBITRUM_CHAIN_ID,
  OPTIMISM_CHAIN_ID,
  ZKSYNC_ERA_CHAIN_ID,
  LINEA_CHAIN_ID,
  BASE_CHAIN_ID,
} = swapsUtils;

const allowedChainIds = [
  ETH_CHAIN_ID,
  BSC_CHAIN_ID,
  POLYGON_CHAIN_ID,
  AVALANCHE_CHAIN_ID,
  ARBITRUM_CHAIN_ID,
  OPTIMISM_CHAIN_ID,
  ZKSYNC_ERA_CHAIN_ID,
  LINEA_CHAIN_ID,
  BASE_CHAIN_ID,
  SWAPS_TESTNET_CHAIN_ID,
];

export const allowedTestnetChainIds = [
  NETWORKS_CHAIN_ID.GOERLI,
  NETWORKS_CHAIN_ID.SEPOLIA,
];

if (__DEV__) {
  allowedChainIds.push(...allowedTestnetChainIds);
}

export function isSwapsAllowed(chainId: string) {
  if (!AppConstants.SWAPS.ACTIVE) {
    return false;
  }
  if (!AppConstants.SWAPS.ONLY_MAINNET) {
    allowedChainIds.push(SWAPS_TESTNET_CHAIN_ID);
  }

  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  if (chainId === SolScope.Mainnet) {
    return true;
  }
  ///: END:ONLY_INCLUDE_IF(keyring-snaps)

  return allowedChainIds.includes(chainId as Hex);
}

export function isSwapsNativeAsset(token: SwapsToken | null | undefined) {
  return (
    Boolean(token) && token?.address === swapsUtils.NATIVE_SWAPS_TOKEN_ADDRESS
  );
}

export function isDynamicToken(token: SwapsToken | null | undefined) {
  return (
    Boolean(token) &&
    token?.occurrences === 1 &&
    token?.aggregators?.length === 1 &&
    token?.aggregators?.[0] === 'dynamic'
  );
}

/**
 * Sets required parameters for Swaps Quotes View
 * @param {string} sourceTokenAddress Token contract address used as swaps source
 * @param {string} destinationTokenAddress Token contract address used as swaps result
 * @param {string} sourceAmount Amount in minimal token units of sourceTokenAddress to be swapped
 * @param {string|number} slippage Max slippage
 * @param {array} tokens Tokens selected for trade
 * @return {object} Object containing sourceTokenAddress, destinationTokenAddress, sourceAmount and slippage
 */
export function setQuotesNavigationsParams(
  sourceTokenAddress: string,
  destinationTokenAddress: string,
  sourceAmount: string,
  slippage: string | number,
  tokens: SwapsToken[] = [],
) {
  return {
    sourceTokenAddress,
    destinationTokenAddress,
    sourceAmount,
    slippage,
    tokens,
  };
}

/**
 * Gets required parameters for Swaps Quotes View
 * @return {object} Object containing sourceTokenAddress, destinationTokenAddress, sourceAmount and slippage
 */
export function getQuotesNavigationsParams(route: SwapsRoute) {
  const slippage = route.params?.slippage ?? 1;
  const sourceTokenAddress = route.params?.sourceTokenAddress ?? '';
  const destinationTokenAddress = route.params?.destinationTokenAddress ?? '';
  const sourceAmount = route.params?.sourceAmount;
  const tokens = route.params?.tokens;

  return {
    sourceTokenAddress,
    destinationTokenAddress,
    sourceAmount,
    slippage,
    tokens,
  };
}

/**
 * Returns object required to startFetchAndSetQuotes
 * @param {object} options
 * @param {string|number} options.slippage
 * @param {object} options.sourceToken sourceToken object from tokens API
 * @param {object} options.destinationToken destinationToken object from tokens API
 * @param {string} sourceAmount Amount in minimal token units of sourceToken to be swapped
 * @param {string} fromAddress Current address attempting to swap
 * @param {string} networkClientId Current network client ID
 * @param {boolean} enableGasIncludedQuotes Enable quotes with gas included
 */
export function getFetchParams({
  slippage = 1,
  sourceToken,
  destinationToken,
  sourceAmount,
  walletAddress,
  networkClientId,
  enableGasIncludedQuotes,
}: GetFetchParamsOptions) {
  return {
    slippage,
    sourceToken: sourceToken.address,
    destinationToken: destinationToken.address,
    sourceAmount,
    walletAddress,
    metaData: {
      sourceTokenInfo: sourceToken,
      destinationTokenInfo: destinationToken,
      networkClientId,
    },
    enableGasIncludedQuotes,
  };
}

export function useRatio(
  numeratorAmount: string | number,
  numeratorDecimals: number,
  denominatorAmount: string | number,
  denominatorDecimals: number,
) {
  const ratio = useMemo(
    () =>
      new BigNumber(numeratorAmount)
        .dividedBy(denominatorAmount)
        .multipliedBy(
          new BigNumber(10).pow(denominatorDecimals - numeratorDecimals),
        ),
    [
      denominatorAmount,
      denominatorDecimals,
      numeratorAmount,
      numeratorDecimals,
    ],
  );

  return ratio;
}

export function getErrorMessage(errorKey: string) {
  const { SwapsError } = swapsUtils;
  const errorAction =
    errorKey === SwapsError.QUOTES_EXPIRED_ERROR
      ? strings('swaps.get_new_quotes')
      : strings('swaps.try_again');
  switch (errorKey) {
    case SwapsError.QUOTES_EXPIRED_ERROR: {
      return [
        strings('swaps.quotes_timeout'),
        strings('swaps.request_new_quotes'),
        errorAction,
      ];
    }
    case SwapsError.QUOTES_NOT_AVAILABLE_ERROR: {
      return [
        strings('swaps.quotes_not_available'),
        strings('swaps.try_adjusting'),
        errorAction,
      ];
    }
    default: {
      return [
        strings('swaps.error_fetching_quote'),
        strings('swaps.unexpected_error', {
          error: errorKey || 'error-not-provided',
        }),
        errorAction,
      ];
    }
  }
}

export function getQuotesSourceMessage(type: string) {
  switch (type) {
    case 'DEX': {
      return [
        strings('swaps.quote_source_dex.1'),
        strings('swaps.quote_source_dex.2'),
        strings('swaps.quote_source_dex.3'),
      ];
    }
    case 'RFQ': {
      return [
        strings('swaps.quote_source_rfq.1'),
        strings('swaps.quote_source_rfq.2'),
        strings('swaps.quote_source_rfq.3'),
      ];
    }
    case 'CONTRACT':
    case 'CNT': {
      return [
        strings('swaps.quote_source_cnt.1'),
        strings('swaps.quote_source_cnt.2'),
        strings('swaps.quote_source_cnt.3'),
      ];
    }
    case 'AGG':
    default: {
      return [
        strings('swaps.quote_source_agg.1'),
        strings('swaps.quote_source_agg.2'),
        strings('swaps.quote_source_agg.3'),
      ];
    }
  }
}

/**
 * Determines whether to show the max balance link in Swaps
 * @param {object} params - Function parameters
 * @param {object} params.sourceToken - Source token object
 * @param {boolean} params.shouldUseSmartTransaction - Whether smart transactions are enabled
 * @param {boolean} params.hasBalance - Whether the user has a balance of the source token
 * @return {boolean} Whether to show the max balance link
 */
export function shouldShowMaxBalanceLink({
  sourceToken,
  shouldUseSmartTransaction,
  hasBalance,
}: ShouldShowMaxBalanceLinkOptions) {
  if (!sourceToken?.symbol || !hasBalance) {
    return false;
  }

  const isNonDefaultFromToken = !isSwapsNativeAsset(sourceToken);
  const isTokenEligibleForMaxBalance =
    shouldUseSmartTransaction ||
    (!shouldUseSmartTransaction && isNonDefaultFromToken);

  return isTokenEligibleForMaxBalance;
}
