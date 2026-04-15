import { useMemo } from 'react';
import { CURRENCIES } from './constants';
import createKeypadRule, { KeypadHandler } from './createKeypadRule';

interface CurrencyData {
  decimalSeparator: string | null;
  handler: KeypadHandler;
  symbol: string | null;
}

function useCurrency(currency?: string, decimals?: number): {
  handler: KeypadHandler;
  symbol: string | null;
  decimalSeparator: string | null;
} {
  const currencyData = useMemo((): CurrencyData => {
    if (!currency) {
      return CURRENCIES.default;
    }

    const existingCurrency =
      CURRENCIES[currency as keyof typeof CURRENCIES] || CURRENCIES[currency.toUpperCase() as keyof typeof CURRENCIES];

    if (existingCurrency) {
      return existingCurrency;
    }

    if (decimals > 0) {
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
