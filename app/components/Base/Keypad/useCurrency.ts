import { useMemo } from 'react';
import { CURRENCIES } from './constants';
import createKeypadRule from './createKeypadRule';

const createRule = createKeypadRule as unknown as (options: {
  decimalSeparator: string;
  decimals: number;
}) => ReturnType<typeof createKeypadRule>;

function useCurrency(currency?: string, decimals?: number) {
  const currencyData = useMemo(() => {
    if (!currency) {
      return CURRENCIES.default;
    }

    const existingCurrency =
      CURRENCIES[currency as keyof typeof CURRENCIES] ||
      CURRENCIES[currency.toUpperCase() as keyof typeof CURRENCIES];

    if (existingCurrency) {
      return existingCurrency;
    }

    if (decimals && decimals > 0) {
      return {
        decimalSeparator: '.',
        handler: createRule({ decimalSeparator: '.', decimals }),
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
