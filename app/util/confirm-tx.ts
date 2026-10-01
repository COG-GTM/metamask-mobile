import BigNumber from 'bignumber.js';
import { addHexPrefix } from './number';

import {
  conversionUtil,
  addCurrencies,
  multiplyCurrencies,
  conversionGreaterThan,
  EthDenomination,
} from './conversion';
import I18n from '../../locales/i18n';

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

interface WeiHexConversionOptions {
  value: string;
  fromCurrency?: string;
  toCurrency?: string;
  conversionRate?: number;
  numberOfDecimals?: number;
  toDenomination?: EthDenomination;
}

interface ConvertTokenToFiatOptions {
  value: string;
  fromCurrency?: string;
  toCurrency?: string;
  conversionRate: number;
  contractExchangeRate?: number;
}

export function increaseLastGasPrice(lastGasPrice: string): string {
  return addHexPrefix(
    multiplyCurrencies(lastGasPrice || '0x0', 1.1, {
      multiplicandBase: 16,
      multiplierBase: 10,
      toNumericBase: 'hex',
    }) as string,
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
    }) as string,
  );
}

export function addEth(...args: string[]): string {
  return args.reduce(
    (acc, ethAmount) =>
      addCurrencies(acc, ethAmount, {
        toNumericBase: 'dec',
        numberOfDecimals: 6,
        aBase: 10,
        bBase: 10,
      }) as string,
  );
}

export function addFiat(...args: string[]): string {
  return args.reduce(
    (acc, fiatAmount) =>
      addCurrencies(acc, fiatAmount, {
        toNumericBase: 'dec',
        numberOfDecimals: 2,
        aBase: 10,
        bBase: 10,
      }) as string,
  );
}

export function getValueFromWeiHex({
  value,
  fromCurrency = 'ETH',
  toCurrency,
  conversionRate,
  numberOfDecimals,
  toDenomination,
}: WeiHexConversionOptions): string {
  return conversionUtil(value, {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
    fromCurrency,
    toCurrency,
    numberOfDecimals,
    fromDenomination: 'WEI',
    toDenomination,
    conversionRate,
  }) as string;
}

export function getTransactionFee({
  value,
  fromCurrency = 'ETH',
  toCurrency,
  conversionRate,
  numberOfDecimals,
}: WeiHexConversionOptions): string {
  return conversionUtil(value, {
    fromNumericBase: 'BN',
    toNumericBase: 'dec',
    fromDenomination: 'WEI',
    fromCurrency,
    toCurrency,
    numberOfDecimals,
    conversionRate,
  }) as string;
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
}: ConvertTokenToFiatOptions): string | number {
  if (!contractExchangeRate) return 0;
  const totalExchangeRate = conversionRate * contractExchangeRate;

  return conversionUtil(value, {
    fromNumericBase: 'dec',
    toNumericBase: 'dec',
    fromCurrency,
    toCurrency,
    numberOfDecimals: 2,
    conversionRate: totalExchangeRate,
  }) as string;
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
