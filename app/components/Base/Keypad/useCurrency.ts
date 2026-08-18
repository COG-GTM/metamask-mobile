import { useMemo } from 'react';
import { CURRENCIES, CurrencyCode } from './constants';
import createKeypadRule from './createKeypadRule';

function useCurrency(currency?: string, decimals?: number) {
  const currencyData = useMemo(() => {
    if (!currency) {
      return CURRENCIES.default;
    }

    const existingCurrency =
      CURRENCIES[currency as CurrencyCode] ||
      CURRENCIES[currency.toUpperCase() as CurrencyCode];

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
