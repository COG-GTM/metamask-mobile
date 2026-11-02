import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentCurrency } from '../../../../../selectors/currencyRateController';
import { BridgeToken } from '../../types';
import { selectTokenMarketData } from '../../../../../selectors/tokenRatesController';
import { exchangeRateFromMarketData } from '../../utils/exchange-rates';
import {
  setSourceTokenExchangeRate,
  setDestTokenExchangeRate,
} from '../../../../../core/redux/slices/bridge';
import useThunkDispatch from '../../../../hooks/useThunkDispatch';
import { RootState } from '../../../../../reducers';

/**
 * Fetches the exchange rate for a token and stores it in the Redux store
 * @param token - The token to fetch the exchange rate for
 * @param currencyOverride - The currency to use for the exchange rate if you want to override the current currency
 * @param action - The action to dispatch to set the exchange rate
 */
export const useBridgeExchangeRates = ({
  token,
  currencyOverride,
  action,
}: {
  token?: BridgeToken;
  currencyOverride?: string;
  action: typeof setSourceTokenExchangeRate | typeof setDestTokenExchangeRate;
}) => {
  const dispatch = useThunkDispatch();
  const currentCurrency = useSelector(selectCurrentCurrency);
  const chainId = token?.chainId;
  const address = token?.address;
  // Only subscribe to this token's price so unrelated rate updates don't re-run the effect
  const exchangeRateInNativeAsset = useSelector((state: RootState) =>
    chainId && address
      ? exchangeRateFromMarketData(
          chainId,
          address,
          selectTokenMarketData(state),
        )
      : undefined,
  );
  const lastRequestedKey = useRef<string>();

  // If a currency override is provided, use it, otherwise use the current currency
  // Used in places like metrics, when we want to get a rate specifically in USD
  const currency = currencyOverride ?? currentCurrency;
  const currencyExchangeRate = token?.currencyExchangeRate;

  // Fetch exchange rates for selected token if not found in marketData
  useEffect(() => {
    if (!chainId || !address) {
      return;
    }

    if (exchangeRateInNativeAsset || currencyExchangeRate) {
      // Allow a new fetch if the rate goes missing again later
      lastRequestedKey.current = undefined;
      return;
    }

    // Unpriced tokens resolve to no rate, so don't re-request the same token and currency
    const requestKey = `${chainId}:${address}:${currency}`;
    if (lastRequestedKey.current === requestKey) {
      return;
    }
    lastRequestedKey.current = requestKey;

    dispatch(
      action({
        chainId,
        tokenAddress: address,
        currency,
      }),
    );
  }, [
    currency,
    dispatch,
    chainId,
    address,
    exchangeRateInNativeAsset,
    action,
    currencyExchangeRate,
  ]);
};
