import BigNumber from 'bignumber.js';
import { addHexPrefix } from './number';

import {
  conversionUtil,
  addCurrencies,
  multiplyCurrencies,
  conversionGreaterThan,
  type ConversionResult,
  type ConvertibleValue,
  type EthDenomination,
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

/**
 * All of the conversions below request an explicit numeric base, so the
 * converter always hands back a string.
 */
const asString = (result: ConversionResult | number): string =>
  typeof result === 'string' ? result : result.toString();

export function increaseLastGasPrice(
  lastGasPrice: ConvertibleValue | undefined,
): string {
  return addHexPrefix(
    asString(
      multiplyCurrencies(lastGasPrice || '0x0', 1.1, {
        multiplicandBase: 16,
        multiplierBase: 10,
        toNumericBase: 'hex',
      }),
    ),
  );
}

export function hexGreaterThan(
  a: ConvertibleValue,
  b: ConvertibleValue,
): boolean {
  return conversionGreaterThan(
    { value: a, fromNumericBase: 'hex' },
    { value: b, fromNumericBase: 'hex' },
  );
}

export function getHexGasTotal({
  gasLimit,
  gasPrice,
}: {
  gasLimit?: ConvertibleValue;
  gasPrice?: ConvertibleValue;
}): string {
  return addHexPrefix(
    asString(
      multiplyCurrencies(gasLimit || '0x0', gasPrice || '0x0', {
        toNumericBase: 'hex',
        multiplicandBase: 16,
        multiplierBase: 16,
      }),
    ),
  );
}

export function addEth(...args: ConvertibleValue[]): string {
  return args
    .map(asString)
    .reduce((acc, ethAmount) =>
      asString(
        addCurrencies(acc, ethAmount, {
          toNumericBase: 'dec',
          numberOfDecimals: 6,
          aBase: 10,
          bBase: 10,
        }),
      ),
    );
}

export function addFiat(...args: ConvertibleValue[]): string {
  return args
    .map(asString)
    .reduce((acc, fiatAmount) =>
      asString(
        addCurrencies(acc, fiatAmount, {
          toNumericBase: 'dec',
          numberOfDecimals: 2,
          aBase: 10,
          bBase: 10,
        }),
      ),
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
  value: ConvertibleValue;
  fromCurrency?: string;
  toCurrency?: string;
  conversionRate?: number | string | BigNumber | null;
  numberOfDecimals?: number;
  toDenomination?: EthDenomination;
}): string {
  return asString(
    conversionUtil(value, {
      fromNumericBase: 'hex',
      toNumericBase: 'dec',
      fromCurrency,
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
}: {
  value: ConvertibleValue;
  fromCurrency?: string;
  toCurrency?: string;
  conversionRate?: number | string | BigNumber | null;
  numberOfDecimals?: number;
}): string {
  return asString(
    conversionUtil(value, {
      fromNumericBase: 'BN',
      toNumericBase: 'dec',
      fromDenomination: 'WEI',
      fromCurrency,
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
}: {
  value: ConvertibleValue;
  fromCurrency?: string;
  toCurrency?: string;
  conversionRate: number;
  contractExchangeRate?: number;
}): string | number {
  if (!contractExchangeRate) return 0;
  const totalExchangeRate = conversionRate * contractExchangeRate;

  return asString(
    conversionUtil(value, {
      fromNumericBase: 'dec',
      toNumericBase: 'dec',
      fromCurrency,
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
