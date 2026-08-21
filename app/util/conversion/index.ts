/* Currency Conversion Utility
 * This utility function can be used for converting currency related values within metamask.
 * The caller should be able to pass it a value, along with information about the value's
 * numeric base, denomination and currency, and the desired numeric base, denomination and
 * currency. It should return a single value.
 *
 * The utility passes value along with the options as a single object to the `converter` function.
 * `converter` conditional modifies the supplied `value` property, depending
 * on the accompanying options.
 */

import BigNumber from 'bignumber.js';
import BN from 'bnjs4';

import { stripHexPrefix } from 'ethereumjs-util';

// Big Number Constants
const BIG_NUMBER_WEI_MULTIPLIER = new BigNumber('1000000000000000000');
const BIG_NUMBER_GWEI_MULTIPLIER = new BigNumber('1000000000');
const BIG_NUMBER_ETH_MULTIPLIER = new BigNumber('1');

/**
 * Defines the base type of numeric value
 */
export type NumericBase = 'hex' | 'dec' | 'BN';

/**
 * Defines which type of denomination a value is in
 */
export type EthDenomination = 'WEI' | 'GWEI' | 'ETH';

/**
 * A value that can be fed to the conversion helpers.
 */
export type ConvertibleValue = string | number | BN | BigNumber;

/**
 * The result of a conversion, which depends on the requested numeric base:
 * a `BN` for `'BN'`, a string for `'hex'`/`'dec'`, and the underlying
 * `BigNumber` when no numeric base is requested.
 */
export type ConversionResult = string | BN | BigNumber;

export interface ConversionOptions {
  fromNumericBase?: NumericBase;
  fromDenomination?: EthDenomination;
  fromCurrency?: string | null;
  toNumericBase?: NumericBase;
  toDenomination?: EthDenomination;
  toCurrency?: string | null;
  numberOfDecimals?: number;
  conversionRate?: number | string | BigNumber | null;
  invertConversionRate?: boolean;
  roundDown?: number;
}

export interface ConverterInput extends ConversionOptions {
  value: ConvertibleValue;
}

// Setter Maps
const toBigNumber: Record<NumericBase, (n: ConvertibleValue) => BigNumber> = {
  hex: (n) => new BigNumber(stripHexPrefix(String(n)), 16),
  dec: (n) => new BigNumber(String(n), 10),
  BN: (n) => new BigNumber(n.toString(16), 16),
};
const toNormalizedDenomination: Record<
  EthDenomination,
  (bigNumber: BigNumber) => BigNumber
> = {
  WEI: (bigNumber) => bigNumber.div(BIG_NUMBER_WEI_MULTIPLIER),
  GWEI: (bigNumber) => bigNumber.div(BIG_NUMBER_GWEI_MULTIPLIER),
  ETH: (bigNumber) => bigNumber.div(BIG_NUMBER_ETH_MULTIPLIER),
};
const toSpecifiedDenomination: Record<
  EthDenomination,
  (bigNumber: BigNumber) => BigNumber
> = {
  WEI: (bigNumber) =>
    bigNumber.times(BIG_NUMBER_WEI_MULTIPLIER).decimalPlaces(0),
  GWEI: (bigNumber) =>
    bigNumber.times(BIG_NUMBER_GWEI_MULTIPLIER).decimalPlaces(9),
  ETH: (bigNumber) =>
    bigNumber.times(BIG_NUMBER_ETH_MULTIPLIER).decimalPlaces(9),
};
const baseChange: Record<NumericBase, (n: BigNumber) => string | BN> = {
  hex: (n) => n.toString(16),
  dec: (n) => new BigNumber(n).toString(10),
  BN: (n) => new BN(n.toString(16)),
};

// Utility function for checking base types
const isValidBase = (base: number | undefined): base is number =>
  Number.isInteger(base) && (base as number) > 1;

/**
 * Utility method to convert a value between denominations, formats and
 * currencies, stopping short of the final numeric base change.
 */
const convertToBigNumber = ({
  value,
  fromNumericBase,
  fromDenomination,
  fromCurrency,
  toCurrency,
  numberOfDecimals,
  toDenomination,
  conversionRate,
  invertConversionRate,
  roundDown,
}: ConverterInput): BigNumber => {
  let convertedValue = fromNumericBase
    ? toBigNumber[fromNumericBase](value)
    : (value as BigNumber);

  if (fromDenomination) {
    convertedValue = toNormalizedDenomination[fromDenomination](convertedValue);
  }

  if (fromCurrency !== toCurrency) {
    if (conversionRate === null || conversionRate === undefined) {
      throw new Error(
        `Converting from ${fromCurrency} to ${toCurrency} requires a conversionRate, but one was not provided`,
      );
    }
    let rate = toBigNumber.dec(conversionRate);
    if (invertConversionRate) {
      rate = new BigNumber(1.0).div(conversionRate);
    }
    convertedValue = convertedValue.times(rate);
  }

  if (toDenomination) {
    convertedValue = toSpecifiedDenomination[toDenomination](convertedValue);
  }

  if (numberOfDecimals) {
    convertedValue = convertedValue.decimalPlaces(
      numberOfDecimals,
      BigNumber.ROUND_HALF_DOWN,
    );
  }

  if (roundDown) {
    convertedValue = convertedValue.decimalPlaces(
      roundDown,
      BigNumber.ROUND_DOWN,
    );
  }

  return convertedValue;
};

/**
 * Utility method to convert a value between denominations, formats and currencies.
 */
const converter = (input: ConverterInput): ConversionResult => {
  const convertedValue = convertToBigNumber(input);

  if (input.toNumericBase) {
    return baseChange[input.toNumericBase](convertedValue);
  }
  return convertedValue;
};

const conversionUtil = (
  value: ConvertibleValue,
  {
    fromCurrency = null,
    toCurrency = fromCurrency,
    fromNumericBase,
    toNumericBase,
    fromDenomination,
    toDenomination,
    numberOfDecimals,
    conversionRate,
    invertConversionRate,
  }: ConversionOptions,
): ConversionResult | number => {
  if (fromCurrency !== toCurrency && !conversionRate) {
    return 0;
  }
  return converter({
    fromCurrency,
    toCurrency,
    fromNumericBase,
    toNumericBase,
    fromDenomination,
    toDenomination,
    numberOfDecimals,
    conversionRate,
    invertConversionRate,
    value: value || '0',
  });
};

const getBigNumber = (value: ConvertibleValue, base: number): BigNumber => {
  if (!isValidBase(base)) {
    throw new Error('Must specify valid base');
  }

  // We don't include 'number' here, because BigNumber will throw if passed
  // a number primitive it considers unsafe.
  if (typeof value === 'string' || value instanceof BigNumber) {
    return new BigNumber(value, base);
  }

  return new BigNumber(String(value), base);
};

export interface CurrencyOperationOptions extends ConversionOptions {
  aBase?: number;
  bBase?: number;
}

export interface MultiplyCurrenciesOptions extends ConversionOptions {
  multiplicandBase?: number;
  multiplierBase?: number;
}

const addCurrencies = (
  a: ConvertibleValue,
  b: ConvertibleValue,
  options: CurrencyOperationOptions = {},
): ConversionResult => {
  const { aBase, bBase, ...conversionOptions } = options;

  if (!isValidBase(aBase) || !isValidBase(bBase)) {
    throw new Error('Must specify valid aBase and bBase');
  }
  const value = getBigNumber(a, aBase).plus(getBigNumber(b, bBase));

  return converter({
    value,
    ...conversionOptions,
  });
};

const subtractCurrencies = (
  a: ConvertibleValue,
  b: ConvertibleValue,
  options: CurrencyOperationOptions = {},
): ConversionResult => {
  const { aBase, bBase, ...conversionOptions } = options;

  if (!isValidBase(aBase) || !isValidBase(bBase)) {
    throw new Error('Must specify valid aBase and bBase');
  }

  const value = getBigNumber(a, aBase).minus(getBigNumber(b, bBase));

  return converter({
    value,
    ...conversionOptions,
  });
};

const multiplyCurrencies = (
  a: ConvertibleValue,
  b: ConvertibleValue,
  options: MultiplyCurrenciesOptions = {},
): ConversionResult => {
  const { multiplicandBase, multiplierBase, ...conversionOptions } = options;

  if (!isValidBase(multiplicandBase) || !isValidBase(multiplierBase)) {
    throw new Error('Must specify valid multiplicandBase and multiplierBase');
  }

  const value = getBigNumber(a, multiplicandBase).times(
    getBigNumber(b, multiplierBase),
  );

  return converter({
    value,
    ...conversionOptions,
  });
};

const conversionGreaterThan = (
  { ...firstProps }: ConverterInput,
  { ...secondProps }: ConverterInput,
): boolean => {
  const firstValue = convertToBigNumber({ ...firstProps });
  const secondValue = convertToBigNumber({ ...secondProps });

  return firstValue.gt(secondValue);
};

const conversionLessThan = (
  { ...firstProps }: ConverterInput,
  { ...secondProps }: ConverterInput,
): boolean => {
  const firstValue = convertToBigNumber({ ...firstProps });
  const secondValue = convertToBigNumber({ ...secondProps });

  return firstValue.lt(secondValue);
};

const conversionMax = (
  { ...firstProps }: ConverterInput,
  { ...secondProps }: ConverterInput,
): ConvertibleValue => {
  const firstIsGreater = conversionGreaterThan(
    { ...firstProps },
    { ...secondProps },
  );

  return firstIsGreater ? firstProps.value : secondProps.value;
};

const conversionGTE = (
  { ...firstProps }: ConverterInput,
  { ...secondProps }: ConverterInput,
): boolean => {
  const firstValue = convertToBigNumber({ ...firstProps });
  const secondValue = convertToBigNumber({ ...secondProps });
  return firstValue.isGreaterThanOrEqualTo(secondValue);
};

const conversionLTE = (
  { ...firstProps }: ConverterInput,
  { ...secondProps }: ConverterInput,
): boolean => {
  const firstValue = convertToBigNumber({ ...firstProps });
  const secondValue = convertToBigNumber({ ...secondProps });
  return firstValue.isLessThanOrEqualTo(secondValue);
};

const toNegative = (
  n: ConvertibleValue,
  options: MultiplyCurrenciesOptions = {},
): ConversionResult => multiplyCurrencies(n, -1, options);

export {
  conversionUtil,
  addCurrencies,
  multiplyCurrencies,
  conversionGreaterThan,
  conversionLessThan,
  conversionGTE,
  conversionLTE,
  conversionMax,
  toNegative,
  subtractCurrencies,
};
