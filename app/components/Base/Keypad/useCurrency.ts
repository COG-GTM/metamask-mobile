import { useMemo } from 'react';
import { CURRENCIES, KeypadCurrency } from './constants';
import createKeypadRule from './createKeypadRule';

function useCurrency(
  currency?: string | null,
  decimals?: number | null,
): KeypadCurrency {
  const currencyData = useMemo<KeypadCurrency>(() => {
    if (!currency) {
      return CURRENCIES.default;
    }

    const existingCurrency =
      CURRENCIES[currency] || CURRENCIES[currency.toUpperCase()];

    if (existingCurrency) {
      return existingCurrency;
    }

    if (decimals && decimals > 0) {
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
