import { useMemo } from 'react';
import { CURRENCIES, Currency } from './constants';
import createKeypadRule from './createKeypadRule';

function useCurrency(currency?: string, decimals?: number) {
  const currencyData = useMemo<Currency>(() => {
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

  const { handler, symbol, decimalSeparator } = currencyData;

  return { handler, symbol, decimalSeparator };
}

export default useCurrency;
