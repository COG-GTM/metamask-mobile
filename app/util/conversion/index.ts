/* Currency Conversion Utility
 * This utility function can be used for converting currency related values within metamask.
 * The caller should be able to pass it a value, along with information about the value's
 * numeric base, denomination and currency, and the desired numeric base, denomination and
 * currency. It should return a single value.
 *
 * @param {(number | string | BN)} value - The value to convert.
 * @param {Object} [options] - Options to specify details of the conversion
 * @param {string} [options.fromCurrency = 'ETH' | 'USD'] - The currency of the passed value
 * @param {string} [options.toCurrency = 'ETH' | 'USD'] - The desired currency of the result
 * @param {string} [options.fromNumericBase = 'hex' | 'dec' | 'BN'] - The numeric basic of the passed value.
 * @param {string} [options.toNumericBase = 'hex' | 'dec' | 'BN'] - The desired numeric basic of the result.
 * @param {string} [options.fromDenomination = 'WEI'] - The denomination of the passed value
 * @param {string} [options.numberOfDecimals] - The desired number of decimals in the result
 * @param {string} [options.roundDown] - The desired number of decimals to round down to
 * @param {number} [options.conversionRate] - The rate to use to make the fromCurrency -> toCurrency conversion
 * @returns {(number | string | BN)}
 *
 * The utility passes value along with the options as a single object to the `converter` function.
 * `converter` conditional modifies the supplied `value` property, depending
 * on the accompanying options.
 */

import BigNumber from 'bignumber.js';
import BN from 'bnjs4';

import { stripHexPrefix } from 'ethereumjs-util';

type NumericBase = 'hex' | 'dec' | 'BN';
type EthDenomination = 'WEI' | 'GWEI' | 'ETH';
type Currency = 'ETH' | 'USD';
type NumericValue = string | number | BigNumber | BN;
type ConversionResult = string | number | BigNumber;
type ComparableBigNumber = BigNumber & {
  greaterThanOrEqualTo(value: BigNumber): boolean;
  lessThanOrEqualTo(value: BigNumber): boolean;
};

interface ConversionOptions {
  fromCurrency?: Currency | null;
  toCurrency?: Currency | null;
  fromNumericBase?: NumericBase;
  toNumericBase?: NumericBase;
  fromDenomination?: EthDenomination;
  toDenomination?: EthDenomination;
  numberOfDecimals?: number;
  conversionRate?: NumericValue;
  invertConversionRate?: boolean;
  roundDown?: number;
}

interface ConverterInput extends ConversionOptions {
  value: NumericValue;
}

interface ArithmeticOptions extends ConversionOptions {
  aBase?: number;
  bBase?: number;
  multiplicandBase?: number;
  multiplierBase?: number;
}

// Big Number Constants
const BIG_NUMBER_WEI_MULTIPLIER = new BigNumber('1000000000000000000');
const BIG_NUMBER_GWEI_MULTIPLIER = new BigNumber('1000000000');
const BIG_NUMBER_ETH_MULTIPLIER = new BigNumber('1');

// Setter Maps
const toBigNumber = {
  hex: (n: NumericValue): BigNumber =>
    new BigNumber(stripHexPrefix(n as string), 16),
  dec: (n: NumericValue): BigNumber => new BigNumber(String(n), 10),
  BN: (n: NumericValue): BigNumber =>
    new BigNumber(n.toString(16), 16),
};
const toNormalizedDenomination = {
  WEI: (bigNumber: BigNumber): BigNumber =>
    bigNumber.div(BIG_NUMBER_WEI_MULTIPLIER),
  GWEI: (bigNumber: BigNumber): BigNumber =>
    bigNumber.div(BIG_NUMBER_GWEI_MULTIPLIER),
  ETH: (bigNumber: BigNumber): BigNumber =>
    bigNumber.div(BIG_NUMBER_ETH_MULTIPLIER),
};
const toSpecifiedDenomination = {
  WEI: (bigNumber: BigNumber): BigNumber =>
    bigNumber.times(BIG_NUMBER_WEI_MULTIPLIER).decimalPlaces(0),
  GWEI: (bigNumber: BigNumber): BigNumber =>
    bigNumber.times(BIG_NUMBER_GWEI_MULTIPLIER).decimalPlaces(9),
  ETH: (bigNumber: BigNumber): BigNumber =>
    bigNumber.times(BIG_NUMBER_ETH_MULTIPLIER).decimalPlaces(9),
};
const baseChange = {
  hex: (n: BigNumber): string => n.toString(16),
  dec: (n: BigNumber): string => new BigNumber(n).toString(10),
  BN: (n: BigNumber): BN => new BN(n.toString(16)),
};

// Utility function for checking base types
const isValidBase = (base: number | undefined): boolean =>
  base !== undefined && Number.isInteger(base) && base > 1;

/**
 * Defines the base type of numeric value
 * @typedef {('hex' | 'dec' | 'BN')} NumericBase
 */

/**
 * Defines which type of denomination a value is in
 * @typedef {('WEI' | 'GWEI' | 'ETH')} EthDenomination
 */

/**
 * Utility method to convert a value between denominations, formats and currencies.
 * @param {Object} input
 * @param {string | BigNumber} input.value
 * @param {NumericBase} input.fromNumericBase
 * @param {EthDenomination} [input.fromDenomination]
 * @param {string} [input.fromCurrency]
 * @param {NumericBase} input.toNumericBase
 * @param {EthDenomination} [input.toDenomination]
 * @param {string} [input.toCurrency]
 * @param {number} [input.numberOfDecimals]
 * @param {number} [input.conversionRate]
 * @param {boolean} [input.invertConversionRate]
 * @param {string} [input.roundDown]
 */
const converter = ({
  value,
  fromNumericBase,
  fromDenomination,
  fromCurrency,
  toNumericBase,
  toDenomination,
  toCurrency,
  numberOfDecimals,
  conversionRate,
  invertConversionRate,
  roundDown,
}: ConverterInput): ConversionResult => {
  let convertedValue = fromNumericBase
    ? toBigNumber[fromNumericBase](value)
    : value;

  if (fromDenomination) {
    convertedValue = toNormalizedDenomination[fromDenomination](
      convertedValue as BigNumber,
    );
  }

  if (fromCurrency !== toCurrency) {
    if (conversionRate === null || conversionRate === undefined) {
      throw new Error(
        `Converting from ${fromCurrency} to ${toCurrency} requires a conversionRate, but one was not provided`,
      );
    }
    let rate = toBigNumber.dec(conversionRate);
    if (invertConversionRate) {
      rate = new BigNumber(1.0).div(
        conversionRate as string | number | BigNumber,
      );
    }
    convertedValue = (convertedValue as BigNumber).times(rate);
  }

  if (toDenomination) {
    convertedValue = toSpecifiedDenomination[toDenomination](
      convertedValue as BigNumber,
    );
  }

  if (numberOfDecimals) {
    convertedValue = (convertedValue as BigNumber).decimalPlaces(
      numberOfDecimals,
      BigNumber.ROUND_HALF_DOWN,
    );
  }

  if (roundDown) {
    convertedValue = (convertedValue as BigNumber).decimalPlaces(
      roundDown,
      BigNumber.ROUND_DOWN,
    );
  }

  if (toNumericBase) {
    convertedValue = baseChange[toNumericBase](convertedValue as BigNumber);
  }
  return convertedValue as ConversionResult;
};

const conversionUtil = (
  value: NumericValue,
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
  }: ConversionOptions = {},
): ConversionResult => {
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

const getBigNumber = (value: NumericValue, base: number | undefined): BigNumber => {
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

const addCurrencies = (
  a: NumericValue,
  b: NumericValue,
  options: ArithmeticOptions = {},
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
  a: NumericValue,
  b: NumericValue,
  options: ArithmeticOptions = {},
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
  a: NumericValue,
  b: NumericValue,
  options: ArithmeticOptions = {},
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
  const firstValue = converter({ ...firstProps });
  const secondValue = converter({ ...secondProps });

  return (firstValue as BigNumber).gt(secondValue as BigNumber);
};

const conversionLessThan = (
  { ...firstProps }: ConverterInput,
  { ...secondProps }: ConverterInput,
): boolean => {
  const firstValue = converter({ ...firstProps });
  const secondValue = converter({ ...secondProps });

  return (firstValue as BigNumber).lt(secondValue as BigNumber);
};

const conversionMax = (
  { ...firstProps }: ConverterInput,
  { ...secondProps }: ConverterInput,
): NumericValue => {
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
  const firstValue = converter({ ...firstProps });
  const secondValue = converter({ ...secondProps });
  return (firstValue as ComparableBigNumber).greaterThanOrEqualTo(
    secondValue as BigNumber,
  );
};

const conversionLTE = (
  { ...firstProps }: ConverterInput,
  { ...secondProps }: ConverterInput,
): boolean => {
  const firstValue = converter({ ...firstProps });
  const secondValue = converter({ ...secondProps });
  return (firstValue as ComparableBigNumber).lessThanOrEqualTo(
    secondValue as BigNumber,
  );
};

const toNegative = (
  n: NumericValue,
  options: ArithmeticOptions = {},
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
