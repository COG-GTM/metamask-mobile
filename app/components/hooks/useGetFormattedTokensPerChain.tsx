import { useSelector } from 'react-redux';
import { useEffect, useMemo, useRef } from 'react';
import { MarketDataDetails, Token } from '@metamask/assets-controllers';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { isCaipChainId, parseCaipAssetType } from '@metamask/utils';
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
import {
  selectMultichainAssets,
  selectMultichainAssetsMetadata,
  selectMultichainAssetsRates,
  selectMultichainBalances,
} from '../../selectors/multichain/multichain';
import { selectNonEvmNetworkConfigurationsByChainId } from '../../selectors/multichainNetworkController';
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

interface TokenToFormat {
  address: string;
  symbol: string;
  decimals: number;
}

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
  const multichainBalances = useSelector(selectMultichainBalances);
  const multichainAssets = useSelector(selectMultichainAssets);
  const multichainAssetsMetadata = useSelector(selectMultichainAssetsMetadata);
  const multichainAssetsRates = useSelector(selectMultichainAssetsRates);
  const nonEvmNetworks = useSelector(
    selectNonEvmNetworkConfigurationsByChainId,
  );

  const marketData = useSelector(selectTokenMarketPriceData);
  const currentCurrency = useSelector(selectCurrentCurrency);
  const currencyRates = useSelector(selectCurrencyRates);
  const showFiatOnTestnets = useSelector(selectShowFiatInTestnets);

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

    function getTokenFiatBalances({
      tokens,
      accountAddress,
      accountId,
      chainId,
      tokenExchangeRates,
      conversionRate,
      decimalsToShow,
    }: {
      tokens: TokenToFormat[];
      accountAddress: string;
      accountId: string;
      chainId: string;
      tokenExchangeRates?: {
        [tokenAddress: string]: { price: number };
      };
      conversionRate: number;
      decimalsToShow: number | undefined;
    }) {
      const formattedTokens = [];
      for (const token of tokens) {
        if (isCaipChainId(chainId)) {
          const balance =
            multichainBalances[accountId]?.[token.address]?.amount ?? '0';
          const exchangeRate = Number(
            multichainAssetsRates[token.address]?.rate ?? 0,
          );
          const tokenBalanceFiat = balanceToFiatNumber(
            balance,
            1,
            exchangeRate,
            decimalsToShow,
          );

          formattedTokens.push({
            address: token.address,
            symbol: token.symbol,
            decimals: token.decimals,
            balance,
            tokenBalanceFiat,
          });
          continue;
        }

        const hexBalance =
          currentTokenBalances[accountAddress]?.[chainId]?.[token.address] ??
          '0x0';

        const decimalBalance = renderFromTokenMinimalUnit(
          hexBalance,
          token.decimals,
        );
        const exchangeRate = tokenExchangeRates?.[token.address]?.price;

        const tokenBalanceFiat = balanceToFiatNumber(
          decimalBalance,
          conversionRate,
          exchangeRate,
          decimalsToShow,
        );

        formattedTokens.push({
          address: token.address,
          symbol: token.symbol,
          decimals: token.decimals,
          balance: decimalBalance,
          tokenBalanceFiat,
        });
      }
      return formattedTokens;
    }

    const result: {
      [address: string]: {
        chainId: string;
        tokensWithBalances: TokensWithBalances[];
      }[];
    } = {};

    for (const account of stableAccounts) {
      const formattedPerNetwork = [];
      for (const singleChain of networksToFormat) {
        const network = allNetworks[singleChain] ?? nonEvmNetworks[singleChain];

        // Skip if the network configuration doesn't exist
        if (!network) {
          continue;
        }

        const isNonEvmChain = isCaipChainId(singleChain);
        const tokens: TokenToFormat[] = isNonEvmChain
          ? (multichainAssets[account.id] ?? []).flatMap((assetId) => {
              const { chainId } = parseCaipAssetType(assetId);
              if (chainId !== singleChain) {
                return [];
              }

              const balance = multichainBalances[account.id]?.[assetId];
              const metadata = multichainAssetsMetadata[assetId];

              return [
                {
                  address: assetId,
                  symbol: metadata?.symbol ?? balance?.unit ?? '',
                  decimals: metadata?.units[0]?.decimals ?? 0,
                },
              ];
            })
          : importedTokens?.[singleChain]?.[account.address] ?? [];
        const conversionRate = isNonEvmChain
          ? 1
          : currencyRates?.[network.nativeCurrency]?.conversionRate ?? 0;
        const tokenExchangeRates = isNonEvmChain
          ? undefined
          : marketData?.[toHexadecimal(singleChain)];
        const decimalsToShow = (currentCurrency === 'usd' && 2) || undefined;
        const tokensWithBalances = getTokenFiatBalances({
          tokens,
          accountAddress: account.address,
          accountId: account.id,
          chainId: singleChain,
          tokenExchangeRates,
          conversionRate,
          decimalsToShow,
        });
        formattedPerNetwork.push({
          chainId: singleChain,
          tokensWithBalances,
        });
      }
      result[account.address] = formattedPerNetwork;
    }

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
    multichainAssets,
    multichainAssetsMetadata,
    multichainAssetsRates,
    multichainBalances,
    nonEvmNetworks,
    shouldAggregateAcrossChains,
    showFiatOnTestnets,
  ]);
};
