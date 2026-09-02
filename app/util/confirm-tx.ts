import BigNumber from 'bignumber.js';
import { addHexPrefix } from './number';

import {
  conversionUtil as untypedConversionUtil,
  addCurrencies as untypedAddCurrencies,
  multiplyCurrencies as untypedMultiplyCurrencies,
  conversionGreaterThan,
} from './conversion';
import I18n from '../../locales/i18n';

interface ConverterOptions {
  fromCurrency?: string;
  toCurrency?: string;
  fromNumericBase?: string;
  toNumericBase?: string;
  fromDenomination?: string;
  toDenomination?: string;
  numberOfDecimals?: number;
  conversionRate?: number;
  invertConversionRate?: boolean;
}

// `./conversion` is still untyped JavaScript; these aliases describe the
// subset of its behaviour relied on here.
const conversionUtil = untypedConversionUtil as unknown as (
  value: string | number,
  options: ConverterOptions,
) => string;

const addCurrencies = untypedAddCurrencies as unknown as (
  a: string | number,
  b: string | number,
  options: ConverterOptions & { aBase: number; bBase: number },
) => string;

const multiplyCurrencies = untypedMultiplyCurrencies as unknown as (
  a: string | number,
  b: string | number,
  options: ConverterOptions & {
    multiplicandBase: number;
    multiplierBase: number;
  },
) => string;

const NON_ISO4217_CRYPTO_CODES = [
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

interface ValueConversionOptions {
  value: string;
  fromCurrency?: string;
  toCurrency?: string;
  conversionRate?: number;
  numberOfDecimals?: number;
  toDenomination?: string;
}

export function increaseLastGasPrice(lastGasPrice: string): string {
  return addHexPrefix(
    multiplyCurrencies(lastGasPrice || '0x0', 1.1, {
      multiplicandBase: 16,
      multiplierBase: 10,
      toNumericBase: 'hex',
    }),
  );
}

export function hexGreaterThan(a: string, b: string): boolean {
  return conversionGreaterThan(
    { value: a, fromNumericBase: 'hex' },
    { value: b, fromNumericBase: 'hex' },
  );
}

export function getHexGasTotal({
  gasLimit,
  gasPrice,
}: {
  gasLimit?: string;
  gasPrice?: string;
}): string {
  return addHexPrefix(
    multiplyCurrencies(gasLimit || '0x0', gasPrice || '0x0', {
      toNumericBase: 'hex',
      multiplicandBase: 16,
      multiplierBase: 16,
    }),
  );
}

export function addEth(...args: string[]): string {
  return args.reduce((acc, ethAmount) =>
    addCurrencies(acc, ethAmount, {
      toNumericBase: 'dec',
      numberOfDecimals: 6,
      aBase: 10,
      bBase: 10,
    }),
  );
}

export function addFiat(...args: string[]): string {
  return args.reduce((acc, fiatAmount) =>
    addCurrencies(acc, fiatAmount, {
      toNumericBase: 'dec',
      numberOfDecimals: 2,
      aBase: 10,
      bBase: 10,
    }),
  );
}

export function getValueFromWeiHex({
  value,
  fromCurrency = 'ETH',
  toCurrency,
  conversionRate,
  numberOfDecimals,
  toDenomination,
}: ValueConversionOptions): string {
  return conversionUtil(value, {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
    fromCurrency,
    toCurrency,
    numberOfDecimals,
    fromDenomination: 'WEI',
    toDenomination,
    conversionRate,
  });
}

export function getTransactionFee({
  value,
  fromCurrency = 'ETH',
  toCurrency,
  conversionRate,
  numberOfDecimals,
}: ValueConversionOptions): string {
  return conversionUtil(value, {
    fromNumericBase: 'BN',
    toNumericBase: 'dec',
    fromDenomination: 'WEI',
    fromCurrency,
    toCurrency,
    numberOfDecimals,
    conversionRate,
  });
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
}: {
  value: string;
  fromCurrency?: string;
  toCurrency?: string;
  conversionRate: number;
  contractExchangeRate?: number;
}): string | number {
  if (!contractExchangeRate) return 0;
  const totalExchangeRate = conversionRate * contractExchangeRate;

  return conversionUtil(value, {
    fromNumericBase: 'dec',
    toNumericBase: 'dec',
    fromCurrency,
    toCurrency,
    numberOfDecimals: 2,
    conversionRate: totalExchangeRate,
  });
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
  return (bigNumberValue.e ?? 0) > 20
    ? bigNumberValue.toPrecision(PRECISION)
    : decimalString;
}
