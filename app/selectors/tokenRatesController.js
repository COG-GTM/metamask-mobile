/* eslint-disable import/prefer-default-export */
import { createSelector } from 'reselect';


import { selectEvmChainId } from './networkController';

import { createDeepEqualSelector } from './util';

/**
 * utility similar to lodash.mapValues.
 * provides a clean abstraction for us to reconfigure this large marketData object
 * @param obj - object to reconfigure
 * @param fn - callback to configure each entry in this object
 * @returns - newly reconfigured object
 */
const mapValues = (
obj,
fn) =>

Object.fromEntries(
  Object.entries(obj ?? {}).map(([key, value]) => [key, fn(value)])
);

const selectTokenRatesControllerState = (state) =>
state.engine.backgroundState.TokenRatesController;

export const selectContractExchangeRates = createSelector(
  selectEvmChainId,
  selectTokenRatesControllerState,
  (chainId, tokenRatesControllerState) =>
  tokenRatesControllerState.marketData[chainId]
);

export const selectContractExchangeRatesByChainId = createSelector(
  selectTokenRatesControllerState,
  (_state, chainId) => chainId,
  (tokenRatesControllerState, chainId) =>
  tokenRatesControllerState.marketData[chainId]
);

export const selectTokenMarketData = createSelector(
  selectTokenRatesControllerState,
  (tokenRatesControllerState) =>
  tokenRatesControllerState.marketData
);

export const selectTokenMarketPriceData = createDeepEqualSelector(
  [selectTokenMarketData],
  (marketData) => {
    const marketPriceData = mapValues(marketData, (tokenData) =>
    mapValues(tokenData, (tokenInfo) => ({ price: tokenInfo?.price }))
    );

    return marketPriceData;
  }
);

export const selectTokenMarketDataByChainId = createSelector(
  [selectTokenMarketData, (_state, chainId) => chainId],
  (marketData, chainId) => marketData?.[chainId] || {}
);