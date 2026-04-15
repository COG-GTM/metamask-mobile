import { createSelector } from 'reselect';


import {
  selectEvmChainId,
  selectNativeCurrencyByChainId,
  selectEvmTicker } from
'./networkController';
import { isTestNet } from '../../app/util/networks';
import { createDeepEqualSelector } from './util';

const selectCurrencyRateControllerState = (state) =>
state?.engine?.backgroundState?.CurrencyRateController;

export const selectConversionRate = createSelector(
  selectCurrencyRateControllerState,
  selectEvmChainId,
  selectEvmTicker,
  (state) => state.settings.showFiatOnTestnets,
  (
  currencyRateControllerState,
  chainId,
  ticker,
  showFiatOnTestnets) =>
  {
    if (chainId && isTestNet(chainId) && !showFiatOnTestnets) {
      return undefined;
    }
    return ticker ?
    currencyRateControllerState?.currencyRates?.[ticker]?.conversionRate :
    undefined;
  }
);

export const selectCurrencyRates = createSelector(
  selectCurrencyRateControllerState,
  (currencyRateControllerState) =>
  currencyRateControllerState?.currencyRates
);

export const selectCurrentCurrency = createDeepEqualSelector(
  selectCurrencyRateControllerState,
  (currencyRateControllerState) =>
  currencyRateControllerState?.currentCurrency
);

export const selectConversionRateBySymbol = createSelector(
  selectCurrencyRateControllerState,
  (_, symbol) => symbol,
  (currencyRateControllerState, symbol) =>
  symbol ?
  currencyRateControllerState?.currencyRates?.[symbol]?.conversionRate ||
  0 :
  0
);

export const selectConversionRateFoAllChains = createSelector(
  selectCurrencyRateControllerState,
  (currencyRateControllerState) =>
  currencyRateControllerState?.currencyRates
);

export const selectConversionRateByChainId = createSelector(
  selectConversionRateFoAllChains,
  (_state, chainId) => chainId,
  (state) => state.settings.showFiatOnTestnets,
  selectNativeCurrencyByChainId,
  (
  currencyRates,
  chainId,
  showFiatOnTestnets,
  nativeCurrency) =>
  {
    if (isTestNet(chainId) && !showFiatOnTestnets) {
      return undefined;
    }

    return currencyRates?.[nativeCurrency]?.conversionRate;
  }
);

export const selectUsdConversionRate = createSelector(
  selectCurrencyRates,
  selectCurrentCurrency,
  (currencyRates, currentCurrency) => currencyRates?.[currentCurrency]?.usdConversionRate
);