import { useMemo } from 'react';
import { CURRENCIES } from './constants';
import createKeypadRule from './createKeypadRule';

interface CurrencyDefinition {
  decimalSeparator: string;
  handler: (current: string, input: string) => string;
  symbol: string | null;
}

function useCurrency(currency?: string, decimals?: number) {
  const currencyData = useMemo<CurrencyDefinition>(() => {
    const currencies = CURRENCIES as unknown as Record<string, CurrencyDefinition>;
    if (!currency) {
      return currencies.default;
    }

    const existingCurrency =
      currencies[currency] || currencies[currency.toUpperCase()];

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

    return currencies.default;
  }, [currency, decimals]);

  const handler = currencyData.handler;
  const symbol = currencyData.symbol;
  const decimalSeparator = currencyData.decimalSeparator;

  return { handler, symbol, decimalSeparator };
}

export default useCurrency;
