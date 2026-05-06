import { useMemo } from 'react';
import { CURRENCIES, CurrencyEntry } from './constants';
import createKeypadRule from './createKeypadRule';

function useCurrency(
  currency: string | null | undefined,
  decimals?: number,
): Pick<CurrencyEntry, 'handler' | 'symbol' | 'decimalSeparator'> {
  const currencyData = useMemo<CurrencyEntry>(() => {
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
