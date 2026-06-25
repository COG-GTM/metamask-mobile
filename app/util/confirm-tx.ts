import BigNumber from 'bignumber.js';
import { addHexPrefix } from './number';

import {
  conversionUtil,
  addCurrencies,
  multiplyCurrencies,
  conversionGreaterThan,
  ConversionValue,
  EthDenomination,
} from './conversion';
import I18n from '../../locales/i18n';

interface CurrencyConversionOptions {
  value: ConversionValue;
  fromCurrency?: string;
  toCurrency?: string;
  conversionRate?: number | null;
  numberOfDecimals?: number;
  toDenomination?: EthDenomination;
  contractExchangeRate?: number;
}

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

export function increaseLastGasPrice(lastGasPrice: ConversionValue) {
  return addHexPrefix(
    multiplyCurrencies(lastGasPrice || '0x0', 1.1, {
      multiplicandBase: 16,
      multiplierBase: 10,
      toNumericBase: 'hex',
    }) as string,
  );
}

export function hexGreaterThan(a: ConversionValue, b: ConversionValue) {
  return conversionGreaterThan(
    { value: a, fromNumericBase: 'hex' },
    { value: b, fromNumericBase: 'hex' },
  );
}

export function getHexGasTotal({
  gasLimit,
  gasPrice,
}: {
  gasLimit?: ConversionValue;
  gasPrice?: ConversionValue;
}) {
  return addHexPrefix(
    multiplyCurrencies(gasLimit || '0x0', gasPrice || '0x0', {
      toNumericBase: 'hex',
      multiplicandBase: 16,
      multiplierBase: 16,
    }) as string,
  );
}

export function addEth(...args: ConversionValue[]) {
  return args.reduce((acc, ethAmount) =>
    addCurrencies(acc, ethAmount, {
      toNumericBase: 'dec',
      numberOfDecimals: 6,
      aBase: 10,
      bBase: 10,
    }),
  );
}

export function addFiat(...args: ConversionValue[]) {
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
}: CurrencyConversionOptions) {
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
}: CurrencyConversionOptions) {
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

export function formatCurrency(value: ConversionValue, currencyCode: string) {
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
}: CurrencyConversionOptions) {
  if (!contractExchangeRate) return 0;
  const totalExchangeRate = (conversionRate ?? 0) * contractExchangeRate;

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
 * @param {string} decimalString - The base-ten number to round.
 * @returns {string} The rounded number, or the original number if no
 * rounding was necessary.
 */
export function roundExponential(decimalString: ConversionValue) {
  const PRECISION = 4;
  const bigNumberValue = new BigNumber(String(decimalString));

  // In JS, numbers with exponentials greater than 20 get displayed as an exponential.
  return (bigNumberValue.e ?? 0) > 20
    ? bigNumberValue.toPrecision(PRECISION)
    : decimalString;
}
