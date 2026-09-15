import BigNumber from 'bignumber.js';
import { addHexPrefix } from './number';

import BN from 'bnjs4';
import {
  conversionUtil as untypedConversionUtil,
  addCurrencies as untypedAddCurrencies,
  subtractCurrencies as untypedSubtractCurrencies,
  multiplyCurrencies as untypedMultiplyCurrencies,
  conversionGreaterThan as untypedConversionGreaterThan,
} from './conversion';
import I18n from '../../locales/i18n';

export type NumericBase = 'hex' | 'dec' | 'BN';
export type ConversionInput = string | number | BigNumber | BN;
export type ConversionRate = string | number | BigNumber;

/**
 * Result of the untyped `./conversion` helpers: a string for `hex`/`dec`
 * numeric bases, a BN for the `BN` base, a BigNumber when no base is
 * requested, or `0` when a cross-currency conversion has no rate.
 */
export type ConversionResult = string | number | BigNumber | BN;

export interface ConversionOptions {
  fromCurrency?: string | null;
  toCurrency?: string | null;
  fromNumericBase?: NumericBase;
  toNumericBase?: NumericBase;
  fromDenomination?: string;
  toDenomination?: string;
  numberOfDecimals?: number;
  conversionRate?: ConversionRate;
  invertConversionRate?: boolean;
  roundDown?: number;
}

export interface CurrencyMathOptions extends ConversionOptions {
  aBase?: number;
  bBase?: number;
}

export interface MultiplyCurrenciesOptions extends ConversionOptions {
  multiplicandBase?: number;
  multiplierBase?: number;
}

export interface ConversionComparisonOperand extends ConversionOptions {
  value: ConversionInput;
}

type ConversionUtil = (
  value: ConversionInput | null | undefined,
  options: ConversionOptions,
) => ConversionResult;
type CurrencyMath = (
  a: ConversionInput,
  b: ConversionInput,
  options?: CurrencyMathOptions,
) => ConversionResult;
type MultiplyCurrencies = (
  a: ConversionInput,
  b: ConversionInput,
  options?: MultiplyCurrenciesOptions,
) => ConversionResult;
type ConversionGreaterThan = (
  first: ConversionComparisonOperand,
  second: ConversionComparisonOperand,
) => boolean;

// `./conversion` is still JavaScript; its JSDoc-inferred signatures are too
// loose (`any` params, `null`-only currencies), so bind precise ones here.
export const conversionUtil: ConversionUtil =
  untypedConversionUtil as unknown as ConversionUtil;
export const addCurrencies: CurrencyMath =
  untypedAddCurrencies as unknown as CurrencyMath;
export const subtractCurrencies: CurrencyMath =
  untypedSubtractCurrencies as unknown as CurrencyMath;
export const multiplyCurrencies: MultiplyCurrencies =
  untypedMultiplyCurrencies as unknown as MultiplyCurrencies;
export const conversionGreaterThan: ConversionGreaterThan =
  untypedConversionGreaterThan as unknown as ConversionGreaterThan;

/**
 * Normalizes a conversion result to its string representation.
 */
export function conversionResultToString(result: ConversionResult): string {
  return typeof result === 'string' ? result : result.toString();
}

/**
 * Narrows a `hex`/`dec` conversion result, which is either the converted
 * string or `0` when a cross-currency conversion had no rate.
 */
export function conversionResultToPrimitive(
  result: ConversionResult,
): string | number {
  return typeof result === 'string' || typeof result === 'number'
    ? result
    : result.toString();
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

export function increaseLastGasPrice(lastGasPrice?: string | null): string {
  return addHexPrefix(
    conversionResultToString(
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

export function getHexGasTotal({
  gasLimit,
  gasPrice,
}: {
  gasLimit?: string | null;
  gasPrice?: string | null;
}): string {
  return addHexPrefix(
    conversionResultToString(
      multiplyCurrencies(gasLimit || '0x0', gasPrice || '0x0', {
        toNumericBase: 'hex',
        multiplicandBase: 16,
        multiplierBase: 16,
      }),
    ),
  );
}

export function addEth(...args: (string | number)[]): string {
  const [first = 0, ...rest] = args;
  return rest.reduce<string>(
    (acc, ethAmount) =>
      conversionResultToString(
        addCurrencies(acc, ethAmount, {
          toNumericBase: 'dec',
          numberOfDecimals: 6,
          aBase: 10,
          bBase: 10,
        }),
      ),
    String(first),
  );
}

export function addFiat(...args: (string | number)[]): string {
  const [first = 0, ...rest] = args;
  return rest.reduce<string>(
    (acc, fiatAmount) =>
      conversionResultToString(
        addCurrencies(acc, fiatAmount, {
          toNumericBase: 'dec',
          numberOfDecimals: 2,
          aBase: 10,
          bBase: 10,
        }),
      ),
    String(first),
  );
}

export interface ValueFromWeiHexParams {
  value: string;
  fromCurrency?: string;
  toCurrency?: string;
  conversionRate?: ConversionRate;
  numberOfDecimals?: number;
  toDenomination?: string;
}

export function getValueFromWeiHex({
  value,
  fromCurrency = 'ETH',
  toCurrency,
  conversionRate,
  numberOfDecimals,
  toDenomination,
}: ValueFromWeiHexParams): string | number {
  return conversionResultToPrimitive(
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

export interface TransactionFeeParams {
  value: ConversionInput;
  fromCurrency?: string;
  toCurrency?: string;
  conversionRate?: ConversionRate;
  numberOfDecimals?: number;
}

export function getTransactionFee({
  value,
  fromCurrency = 'ETH',
  toCurrency,
  conversionRate,
  numberOfDecimals,
}: TransactionFeeParams): string | number {
  return conversionResultToPrimitive(
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

export interface ConvertTokenToFiatParams {
  value: string | number;
  fromCurrency?: string;
  toCurrency?: string;
  conversionRate: number;
  contractExchangeRate?: number | null;
}

export function convertTokenToFiat({
  value,
  fromCurrency = 'ETH',
  toCurrency,
  conversionRate,
  contractExchangeRate,
}: ConvertTokenToFiatParams): string | number {
  if (!contractExchangeRate) return 0;
  const totalExchangeRate = conversionRate * contractExchangeRate;

  return conversionResultToPrimitive(
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
