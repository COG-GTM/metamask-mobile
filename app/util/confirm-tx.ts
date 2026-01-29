import BigNumber from 'bignumber.js';
import { addHexPrefix } from './number';

import {
  conversionUtil,
  addCurrencies,
  multiplyCurrencies,
  conversionGreaterThan,
} from './conversion';
import I18n from '../../locales/i18n';

const NON_ISO4217_CRYPTO_CODES: string[] = [
  '1ST',
  'DASH',
  'MYST',
  'PTOY',
  'QTUM',
  'SC',
  'SNGLS',
  'STORJ',
  'STEEM',
  'TIME',
  'TRST',
  'USDC',
  'USDT',
  'WINGS',
  'ZEC',
];

interface GasTotalParams {
  gasLimit: string;
  gasPrice: string;
}

interface ValueFromWeiHexParams {
  value: string;
  fromCurrency?: string;
  toCurrency: string;
  conversionRate: number;
  numberOfDecimals: number;
  toDenomination?: string;
}

interface TransactionFeeParams {
  value: string;
  fromCurrency?: string;
  toCurrency: string;
  conversionRate: number;
  numberOfDecimals: number;
}

interface ConvertTokenToFiatParams {
  value: string;
  fromCurrency?: string;
  toCurrency: string;
  conversionRate: number;
  contractExchangeRate: number;
}

export function increaseLastGasPrice(lastGasPrice: string): string {
  return addHexPrefix(
    String(
      multiplyCurrencies(lastGasPrice || '0x0', 1.1, {
        multiplicandBase: 16,
        multiplierBase: 10,
        toNumericBase: 'hex',
      }),
    ),
  );
}

export function hexGreaterThan(a: string, b: string): boolean {
  return conversionGreaterThan(
    { value: a, fromNumericBase: 'hex' },
    { value: b, fromNumericBase: 'hex' },
  );
}

export function getHexGasTotal({ gasLimit, gasPrice }: GasTotalParams): string {
  return addHexPrefix(
    String(
      multiplyCurrencies(gasLimit || '0x0', gasPrice || '0x0', {
        toNumericBase: 'hex',
        multiplicandBase: 16,
        multiplierBase: 16,
      }),
    ),
  );
}

export function addEth(...args: (string | number)[]): string {
  let result: string | number = 0;
  for (const ethAmount of args) {
    result = String(
      addCurrencies(result, ethAmount, {
        toNumericBase: 'dec',
        numberOfDecimals: 6,
        aBase: 10,
        bBase: 10,
      }),
    );
  }
  return String(result);
}

export function addFiat(...args: (string | number)[]): string {
  let result: string | number = 0;
  for (const fiatAmount of args) {
    result = String(
      addCurrencies(result, fiatAmount, {
        toNumericBase: 'dec',
        numberOfDecimals: 2,
        aBase: 10,
        bBase: 10,
      }),
    );
  }
  return String(result);
}

export function getValueFromWeiHex({
  value,
  fromCurrency = 'ETH',
  toCurrency,
  conversionRate,
  numberOfDecimals,
  toDenomination,
}: ValueFromWeiHexParams): string {
  return String(
    conversionUtil(value, {
      fromNumericBase: 'hex',
      toNumericBase: 'dec',
      // @ts-expect-error - conversion module needs TypeScript conversion for proper currency types
      fromCurrency,
      // @ts-expect-error - conversion module needs TypeScript conversion for proper currency types
      toCurrency,
      numberOfDecimals,
      fromDenomination: 'WEI',
      toDenomination,
      conversionRate,
    }),
  );
}

export function getTransactionFee({
  value,
  fromCurrency = 'ETH',
  toCurrency,
  conversionRate,
  numberOfDecimals,
}: TransactionFeeParams): string {
  return String(
    conversionUtil(value, {
      fromNumericBase: 'BN',
      toNumericBase: 'dec',
      fromDenomination: 'WEI',
      // @ts-expect-error - conversion module needs TypeScript conversion for proper currency types
      fromCurrency,
      // @ts-expect-error - conversion module needs TypeScript conversion for proper currency types
      toCurrency,
      numberOfDecimals,
      conversionRate,
    }),
  );
}

export function formatCurrency(
  value: string | number,
  currencyCode: string,
): string {
  const upperCaseCurrencyCode = currencyCode.toUpperCase();

  const formatedCurrency = NON_ISO4217_CRYPTO_CODES.includes(
    upperCaseCurrencyCode,
  )
    ? `${Number(value)} ${upperCaseCurrencyCode}`
    : new Intl.NumberFormat(I18n.locale, {
        currency: upperCaseCurrencyCode,
        style: 'currency',
      }).format(Number(value));

  return formatedCurrency;
}

export function convertTokenToFiat({
  value,
  fromCurrency = 'ETH',
  toCurrency,
  conversionRate,
  contractExchangeRate,
}: ConvertTokenToFiatParams): number | string {
  if (!contractExchangeRate) return 0;
  const totalExchangeRate = conversionRate * contractExchangeRate;

  return String(
    conversionUtil(value, {
      fromNumericBase: 'dec',
      toNumericBase: 'dec',
      // @ts-expect-error - conversion module needs TypeScript conversion for proper currency types
      fromCurrency,
      // @ts-expect-error - conversion module needs TypeScript conversion for proper currency types
      toCurrency,
      numberOfDecimals: 2,
      conversionRate: totalExchangeRate,
    }),
  );
}

/**
 * Rounds the given decimal string to 4 significant digits.
 *
 * @param decimalString - The base-ten number to round.
 * @returns The rounded number, or the original number if no
 * rounding was necessary.
 */
export function roundExponential(decimalString: string): string {
  const PRECISION = 4;
  const bigNumberValue = new BigNumber(decimalString);

  // In JS, numbers with exponentials greater than 20 get displayed as an exponential.
  return bigNumberValue.e !== null && bigNumberValue.e > 20
    ? bigNumberValue.toPrecision(PRECISION)
    : decimalString;
}
