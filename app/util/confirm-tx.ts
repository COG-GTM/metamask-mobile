import BigNumber from 'bignumber.js';
import { addHexPrefix } from './number';

import {
  conversionUtil,
  addCurrencies,
  multiplyCurrencies,
  conversionGreaterThan,
} from './conversion';
import I18n from '../../locales/i18n';

type ConversionOutput = string | number | BigNumber;
const typedConversionUtil = conversionUtil as unknown as (
  value: unknown,
  options: Record<string, unknown>,
) => ConversionOutput;
const typedAddCurrencies = addCurrencies as unknown as (
  a: unknown,
  b: unknown,
  options: Record<string, unknown>,
) => ConversionOutput;
const typedMultiplyCurrencies = multiplyCurrencies as unknown as (
  a: unknown,
  b: unknown,
  options: Record<string, unknown>,
) => ConversionOutput;
const typedConversionGreaterThan = conversionGreaterThan as unknown as (
  a: Record<string, unknown>,
  b: Record<string, unknown>,
) => boolean;

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

export function increaseLastGasPrice(lastGasPrice: string | number): string {
  return addHexPrefix(
    typedMultiplyCurrencies(lastGasPrice || '0x0', 1.1, {
      multiplicandBase: 16,
      multiplierBase: 10,
      toNumericBase: 'hex',
    }) as string,
  );
}

export function hexGreaterThan(a: string, b: string): boolean {
  return typedConversionGreaterThan(
    { value: a, fromNumericBase: 'hex' },
    { value: b, fromNumericBase: 'hex' },
  );
}

export function getHexGasTotal({
  gasLimit,
  gasPrice,
}: {
  gasLimit?: string | number;
  gasPrice?: string | number;
}): string {
  return addHexPrefix(
    typedMultiplyCurrencies(gasLimit || '0x0', gasPrice || '0x0', {
      toNumericBase: 'hex',
      multiplicandBase: 16,
      multiplierBase: 16,
    }) as string,
  );
}

export function addEth(
  ...args: (string | number)[]
): string | number | BigNumber {
  return args.reduce((acc, ethAmount) =>
    typedAddCurrencies(acc, ethAmount, {
      toNumericBase: 'dec',
      numberOfDecimals: 6,
      aBase: 10,
      bBase: 10,
    }) as string | number,
  );
}

export function addFiat(
  ...args: (string | number)[]
): string | number | BigNumber {
  return args.reduce((acc, fiatAmount) =>
    typedAddCurrencies(acc, fiatAmount, {
      toNumericBase: 'dec',
      numberOfDecimals: 2,
      aBase: 10,
      bBase: 10,
    }) as string | number,
  );
}

export function getValueFromWeiHex({
  value,
  fromCurrency = 'ETH',
  toCurrency,
  conversionRate,
  numberOfDecimals,
  toDenomination,
}: {
  value: string | number;
  fromCurrency?: string;
  toCurrency?: string;
  conversionRate?: string | number;
  numberOfDecimals?: number;
  toDenomination?: string;
}): string | number | BigNumber {
  return typedConversionUtil(value, {
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
}: {
  value: BigNumber | string | number;
  fromCurrency?: string;
  toCurrency?: string;
  conversionRate?: string | number;
  numberOfDecimals?: number;
}): string | number | BigNumber {
  return typedConversionUtil(value, {
    fromNumericBase: 'BN',
    toNumericBase: 'dec',
    fromDenomination: 'WEI',
    fromCurrency,
    toCurrency,
    numberOfDecimals,
    conversionRate,
  });
}

export function formatCurrency(value: string | number, currencyCode: string): string {
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
  value: string | number;
  fromCurrency?: string;
  toCurrency?: string;
  conversionRate: number;
  contractExchangeRate?: number;
}): string | number | BigNumber {
  if (!contractExchangeRate) return 0;
  const totalExchangeRate = conversionRate * contractExchangeRate;

  return typedConversionUtil(value, {
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
 * @param {string} decimalString - The base-ten number to round.
 * @returns {string} The rounded number, or the original number if no
 * rounding was necessary.
 */
export function roundExponential(decimalString: string): string {
  const PRECISION = 4;
  const bigNumberValue = new BigNumber(decimalString);

  // In JS, numbers with exponentials greater than 20 get displayed as an exponential.
  return (bigNumberValue.e as number) > 20
    ? bigNumberValue.toPrecision(PRECISION)
    : decimalString;
}
