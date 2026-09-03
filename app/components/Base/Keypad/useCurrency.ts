import { useMemo } from 'react';
import { CURRENCIES, type CurrencyData } from './constants';
import createKeypadRule, { type KeypadHandler } from './createKeypadRule';

function useCurrency(
  currency?: string,
  decimals?: number,
): {
  handler: KeypadHandler;
  symbol: string | null;
  decimalSeparator: string | null;
} {
  const currencyData = useMemo<CurrencyData>(() => {
    if (!currency) {
      return CURRENCIES.default;
    }

    const existingCurrency =
      CURRENCIES[currency] || CURRENCIES[currency.toUpperCase()];

    if (existingCurrency) {
      return existingCurrency;
    }

    if (decimals !== undefined && decimals > 0) {
      return {
        decimalSeparator: '.',
        handler: createKeypadRule({ decimalSeparator: '.', decimals }),
        symbol: null,
      };
    }

    return CURRENCIES.default;
  }, [currency, decimals]);

  const handler = currencyData.handler;
  const symbol = currencyData.symbol;
  const decimalSeparator = currencyData.decimalSeparator;

  return { handler, symbol, decimalSeparator };
}

export default useCurrency;
