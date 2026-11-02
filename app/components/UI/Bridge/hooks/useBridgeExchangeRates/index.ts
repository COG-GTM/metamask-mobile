import { useEffect, useRef, useState } from 'react';
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

export const EXCHANGE_RATE_RETRY_DELAY_MS = 30000;
export const MAX_EXCHANGE_RATE_FETCH_ATTEMPTS = 3;

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
  const lastRequest = useRef<{
    key: string;
    attempts: number;
    retryDue: boolean;
  }>();
  const retryTimer = useRef<ReturnType<typeof setTimeout>>();
  const [retryTick, setRetryTick] = useState(0);

  // If a currency override is provided, use it, otherwise use the current currency
  // Used in places like metrics, when we want to get a rate specifically in USD
  const currency = currencyOverride ?? currentCurrency;
  const currencyExchangeRate = token?.currencyExchangeRate;

  useEffect(
    () => () => {
      clearTimeout(retryTimer.current);
    },
    [],
  );

  // Fetch exchange rates for selected token if not found in marketData
  useEffect(() => {
    const cancelRetry = () => {
      clearTimeout(retryTimer.current);
      retryTimer.current = undefined;
    };

    if (
      !chainId ||
      !address ||
      exchangeRateInNativeAsset ||
      currencyExchangeRate
    ) {
      // Allow a new fetch if the rate goes missing again later
      lastRequest.current = undefined;
      cancelRetry();
      return;
    }

    // Only re-request the same token and currency when a delayed retry is due,
    // so unpriced tokens aren't fetched on every render
    const requestKey = `${chainId}:${address}:${currency}`;
    const previous =
      lastRequest.current?.key === requestKey ? lastRequest.current : undefined;
    if (
      previous &&
      (!previous.retryDue ||
        previous.attempts >= MAX_EXCHANGE_RATE_FETCH_ATTEMPTS)
    ) {
      return;
    }
    const attempts = (previous?.attempts ?? 0) + 1;
    lastRequest.current = { key: requestKey, attempts, retryDue: false };
    cancelRetry();

    dispatch(
      action({
        chainId,
        tokenAddress: address,
        currency,
      }),
    );

    if (attempts < MAX_EXCHANGE_RATE_FETCH_ATTEMPTS) {
      retryTimer.current = setTimeout(() => {
        retryTimer.current = undefined;
        if (lastRequest.current?.key === requestKey) {
          lastRequest.current.retryDue = true;
          setRetryTick((tick) => tick + 1);
        }
      }, EXCHANGE_RATE_RETRY_DELAY_MS);
    }
  }, [
    currency,
    dispatch,
    chainId,
    address,
    exchangeRateInNativeAsset,
    action,
    currencyExchangeRate,
    retryTick,
  ]);
};
