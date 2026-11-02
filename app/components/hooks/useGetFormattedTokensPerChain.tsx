import { useSelector } from 'react-redux';
import { useEffect, useMemo, useRef } from 'react';
import { MarketDataDetails, Token } from '@metamask/assets-controllers';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { isEqual } from 'lodash';
import { selectAllTokens } from '../../selectors/tokensController';
import { selectAllTokenBalances } from '../../selectors/tokenBalancesController';
import {
  balanceToFiatNumber,
  renderFromTokenMinimalUnit,
  toHexadecimal,
} from '../../util/number';
import {
  selectChainId,
  selectNetworkConfigurations,
} from '../../selectors/networkController';
import { selectTokenMarketPriceData } from '../../selectors/tokenRatesController';
import {
  selectCurrencyRates,
  selectCurrentCurrency,
} from '../../selectors/currencyRateController';
import { isTestNet } from '../../util/networks';
import { selectShowFiatInTestnets } from '../../selectors/settings';
interface AllTokens {
  [chainId: string]: {
    [tokenAddress: string]: Token[];
  };
}

export interface TokensWithBalances {
  address: string;
  symbol: string;
  decimals: number;
  balance: string;
  tokenBalanceFiat: number;
}

interface AddressMapping {
  [chainId: string]: {
    [tokenAddress: string]: string;
  };
}

interface TokenBalancesMapping {
  [address: string]: AddressMapping;
}

export interface MarketDataMapping {
  [chainId: string]: {
    [tokenAddress: string]: MarketDataDetails;
  };
}

type TokenExchangeRates =
  | {
      [tokenAddress: string]: { price?: number } | undefined;
    }
  | undefined;

export interface FormattedChainTokens {
  chainId: string;
  tokensWithBalances: TokensWithBalances[];
}

interface FormattedTokenCacheItem {
  hexBalance: string;
  price: number | undefined;
  value: TokensWithBalances;
}

interface FormattedChainCacheEntry {
  tokens: Token[];
  balances: AddressMapping[string] | undefined;
  tokenExchangeRates: TokenExchangeRates;
  conversionRate: number;
  decimalsToShow: number | undefined;
  items: FormattedTokenCacheItem[];
  value: FormattedChainTokens;
}

const EMPTY_TOKENS: Token[] = [];
const MAX_CACHED_ACCOUNT_CHAINS = 1000;

/**
 * Shared across every hook instance: formatted tokens per `${account}:${chainId}`.
 * Entries are reused while their inputs are unchanged, so a balance or price
 * update only re-runs the BN formatting for the tokens that actually changed.
 */
const formattedChainCache = new Map<string, FormattedChainCacheEntry>();

/**
 * Empties the shared formatted-token cache. Intended for tests.
 */
export const clearFormattedTokensPerChainCache = () => {
  formattedChainCache.clear();
};

/**
 * Whether a previously formatted token still describes `token`.
 *
 * @param previous - Formatted token from the cache, if any.
 * @param token - Current token metadata.
 * @returns True when address, symbol and decimals all match.
 */
const isSameToken = (
  previous: TokensWithBalances | undefined,
  token: Token,
): previous is TokensWithBalances =>
  previous !== undefined &&
  previous.address === token.address &&
  previous.symbol === token.symbol &&
  previous.decimals === token.decimals;

/**
 * Formats one account's tokens on one chain, reusing cached output wherever the
 * inputs are unchanged: BN formatting only runs for tokens whose hex balance or
 * metadata changed, and fiat only for tokens whose price or rate changed.
 *
 * @param params - Formatting inputs.
 * @param params.accountAddress - Account the tokens belong to.
 * @param params.chainId - Chain the tokens live on.
 * @param params.tokens - Imported tokens for this account and chain.
 * @param params.balances - Hex balances by token address for this account and chain.
 * @param params.tokenExchangeRates - Token prices by address for this chain.
 * @param params.conversionRate - Native currency to fiat conversion rate.
 * @param params.decimalsToShow - Fiat decimals, or undefined for the default.
 * @returns The formatted chain entry; the cached instance when nothing changed.
 */
const formatChainTokens = ({
  accountAddress,
  chainId,
  tokens,
  balances,
  tokenExchangeRates,
  conversionRate,
  decimalsToShow,
}: {
  accountAddress: string;
  chainId: string;
  tokens: Token[];
  balances: AddressMapping[string] | undefined;
  tokenExchangeRates: TokenExchangeRates;
  conversionRate: number;
  decimalsToShow: number | undefined;
}): FormattedChainTokens => {
  const cacheKey = `${accountAddress}:${chainId}`;
  const cached = formattedChainCache.get(cacheKey);
  const sameFiatInputs =
    cached !== undefined &&
    cached.conversionRate === conversionRate &&
    cached.decimalsToShow === decimalsToShow;

  if (
    sameFiatInputs &&
    cached.tokens === tokens &&
    cached.balances === balances &&
    cached.tokenExchangeRates === tokenExchangeRates
  ) {
    return cached.value;
  }

  const items: FormattedTokenCacheItem[] = [];
  let unchanged = cached !== undefined && cached.items.length === tokens.length;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const previous = cached?.items[i];
    const hexBalance = balances?.[token.address] ?? '0x0';
    const price = tokenExchangeRates?.[token.address]?.price;

    const sameBalance =
      previous !== undefined &&
      previous.hexBalance === hexBalance &&
      isSameToken(previous.value, token);

    if (sameBalance && sameFiatInputs && previous.price === price) {
      items.push(previous);
      continue;
    }

    unchanged = false;
    const decimalBalance = sameBalance
      ? previous.value.balance
      : renderFromTokenMinimalUnit(hexBalance, token.decimals);
    const tokenBalanceFiat = balanceToFiatNumber(
      decimalBalance,
      conversionRate,
      price as number,
      decimalsToShow,
    );

    items.push({
      hexBalance,
      price,
      value: {
        address: token.address,
        symbol: token.symbol,
        decimals: token.decimals,
        balance: decimalBalance,
        tokenBalanceFiat,
      },
    });
  }

  const value =
    unchanged && cached
      ? cached.value
      : {
          chainId,
          tokensWithBalances: items.map((item) => item.value),
        };

  formattedChainCache.delete(cacheKey);
  if (formattedChainCache.size >= MAX_CACHED_ACCOUNT_CHAINS) {
    const oldestKey = formattedChainCache.keys().next().value;
    if (oldestKey !== undefined) {
      formattedChainCache.delete(oldestKey);
    }
  }
  formattedChainCache.set(cacheKey, {
    tokens,
    balances,
    tokenExchangeRates,
    conversionRate,
    decimalsToShow,
    items,
    value,
  });

  return value;
};

/**
 * Shallow, element-by-reference array comparison.
 *
 * @param a - Previous array, if any.
 * @param b - Next array.
 * @returns True when both have the same length and identical elements.
 */
const isSameArray = <T,>(a: T[] | undefined, b: T[]) =>
  a !== undefined &&
  a.length === b.length &&
  a.every((item, index) => item === b[index]);

/**
 * Ensures that a field is a stable reference.
 * For example a consumer of a hook could unintentionally pass in a hardcoded array:
 * ```
 * useGetFormattedTokensPerChain([internalAccount]) // BAD since it always is a new reference!
 * ```
 *
 * Using this allows the consumer of the hook to be a bit more flexible
 * ```
 * useGetFormattedTokensPerChain([internalAccount]) // This is okay now
 * ```
 * @param value - unstable property
 * @returns - stable property
 */
const useStableReference = <T,>(value: T) => {
  const ref = useRef(value);

  useEffect(() => {
    if (!isEqual(ref.current, value)) {
      ref.current = value;
    }
  }, [value]);

  return ref.current;
};

export const useGetFormattedTokensPerChain = (
  accounts: InternalAccount[],
  shouldAggregateAcrossChains: boolean, // We don't always want to aggregate across chains.
  allChainIDs: string[],
): {
  [address: string]: {
    chainId: string;
    tokensWithBalances: TokensWithBalances[];
  }[];
} => {
  const stableAccounts = useStableReference(accounts);
  const stableAllChainIDs = useStableReference(allChainIDs);

  // TODO: [SOLANA] Revisit this before shipping, `selectAllTokenBalances` selector needs to most likely be replaced by a non evm supported version
  const currentChainId = useSelector(selectChainId);
  const importedTokens: AllTokens = useSelector(selectAllTokens);
  const allNetworks: Record<
    string,
    {
      name: string;
      nativeCurrency: string;
    }
  > = useSelector(selectNetworkConfigurations);
  const currentTokenBalances: TokenBalancesMapping = useSelector(
    selectAllTokenBalances,
  );

  const marketData = useSelector(selectTokenMarketPriceData);
  const currentCurrency = useSelector(selectCurrentCurrency);
  const currencyRates = useSelector(selectCurrencyRates);
  const showFiatOnTestnets = useSelector(selectShowFiatInTestnets);

  const previousResultRef = useRef<{
    [address: string]: FormattedChainTokens[];
  }>({});

  return useMemo(() => {
    //If the current network is a testnet, UI should display 0 unless conversions are enabled
    const validAccounts =
      stableAccounts.length > 0 &&
      stableAccounts.every((item) => item !== undefined);
    if (!validAccounts || (isTestNet(currentChainId) && !showFiatOnTestnets)) {
      return {};
    }

    const networksToFormat = shouldAggregateAcrossChains
      ? stableAllChainIDs
      : [currentChainId];
    const decimalsToShow = (currentCurrency === 'usd' && 2) || undefined;
    const previousResult = previousResultRef.current;

    const result: {
      [address: string]: FormattedChainTokens[];
    } = {};
    let resultUnchanged = true;

    for (const account of stableAccounts) {
      const formattedPerNetwork: FormattedChainTokens[] = [];
      for (const singleChain of networksToFormat) {
        // Skip if the network configuration doesn't exist
        if (!allNetworks[singleChain]) {
          continue;
        }

        const matchedChainSymbol = allNetworks[singleChain].nativeCurrency;
        formattedPerNetwork.push(
          formatChainTokens({
            accountAddress: account.address,
            chainId: singleChain,
            tokens:
              importedTokens?.[singleChain]?.[account?.address] ?? EMPTY_TOKENS,
            balances: currentTokenBalances[account.address]?.[singleChain],
            tokenExchangeRates: marketData?.[toHexadecimal(singleChain)],
            conversionRate:
              currencyRates?.[matchedChainSymbol]?.conversionRate ?? 0,
            decimalsToShow,
          }),
        );
      }

      const previousPerNetwork = previousResult[account.address];
      if (isSameArray(previousPerNetwork, formattedPerNetwork)) {
        result[account.address] = previousPerNetwork;
      } else {
        result[account.address] = formattedPerNetwork;
        resultUnchanged = false;
      }
    }

    if (
      resultUnchanged &&
      Object.keys(previousResult).length === Object.keys(result).length
    ) {
      return previousResult;
    }

    previousResultRef.current = result;
    return result;
  }, [
    stableAccounts,
    stableAllChainIDs,
    allNetworks,
    currentChainId,
    currentCurrency,
    currentTokenBalances,
    currencyRates,
    importedTokens,
    marketData,
    shouldAggregateAcrossChains,
    showFiatOnTestnets,
  ]);
};
