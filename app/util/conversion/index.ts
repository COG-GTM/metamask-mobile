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

export type NumericBase = 'hex' | 'dec' | 'BN';
export type EthDenomination = 'WEI' | 'GWEI' | 'ETH';
export type ConversionInput =
  | string
  | number
  | BigNumber
  | BN
  | null
  | undefined;
type ConversionResult<B extends NumericBase | undefined> = B extends 'BN'
  ? BN
  : B extends 'hex' | 'dec'
  ? string
  : BigNumber;

interface ConverterOptions<B extends NumericBase | undefined = undefined> {
  fromNumericBase?: NumericBase;
  fromDenomination?: EthDenomination;
  fromCurrency?: string | null;
  toNumericBase?: B;
  toDenomination?: EthDenomination;
  toCurrency?: string | null;
  numberOfDecimals?: number;
  conversionRate?: number | string | BigNumber | null;
  invertConversionRate?: boolean;
  roundDown?: number;
}

type ConverterInput<B extends NumericBase | undefined = undefined> =
  ConverterOptions<B> & { value: ConversionInput };

// Big Number Constants
const BIG_NUMBER_WEI_MULTIPLIER = new BigNumber('1000000000000000000');
const BIG_NUMBER_GWEI_MULTIPLIER = new BigNumber('1000000000');
const BIG_NUMBER_ETH_MULTIPLIER = new BigNumber('1');

// Setter Maps
const toBigNumber: Record<NumericBase, (n: ConversionInput) => BigNumber> = {
  hex: (n) => new BigNumber(stripHexPrefix(String(n)), 16),
  dec: (n) => new BigNumber(String(n), 10),
  BN: (n) => new BigNumber((n as BN).toString(16), 16),
};
const toNormalizedDenomination: Record<
  EthDenomination,
  (bigNumber: BigNumber) => BigNumber
> = {
  WEI: (bigNumber: BigNumber) => bigNumber.div(BIG_NUMBER_WEI_MULTIPLIER),
  GWEI: (bigNumber: BigNumber) => bigNumber.div(BIG_NUMBER_GWEI_MULTIPLIER),
  ETH: (bigNumber: BigNumber) => bigNumber.div(BIG_NUMBER_ETH_MULTIPLIER),
};
const toSpecifiedDenomination: Record<
  EthDenomination,
  (bigNumber: BigNumber) => BigNumber
> = {
  WEI: (bigNumber: BigNumber) =>
    bigNumber.times(BIG_NUMBER_WEI_MULTIPLIER).decimalPlaces(0),
  GWEI: (bigNumber: BigNumber) =>
    bigNumber.times(BIG_NUMBER_GWEI_MULTIPLIER).decimalPlaces(9),
  ETH: (bigNumber: BigNumber) =>
    bigNumber.times(BIG_NUMBER_ETH_MULTIPLIER).decimalPlaces(9),
};
const baseChange: {
  hex: (n: BigNumber) => string;
  dec: (n: BigNumber) => string;
  BN: (n: BigNumber) => BN;
} = {
  hex: (n: BigNumber) => n.toString(16),
  dec: (n: BigNumber) => new BigNumber(n).toString(10),
  BN: (n: BigNumber) => new BN(n.toString(16)),
};

// Utility function for checking base types
const isValidBase = (base?: number): boolean =>
  base !== undefined && Number.isInteger(base) && base > 1;

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
const converter = <B extends NumericBase | undefined = undefined>({
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
}: ConverterInput<B>): ConversionResult<B> => {
  let convertedValue: BigNumber = fromNumericBase
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

  if (toNumericBase) {
    return baseChange[toNumericBase](convertedValue) as ConversionResult<B>;
  }
  return convertedValue as ConversionResult<B>;
};

const conversionUtil = <B extends NumericBase | undefined = undefined>(
  value: ConversionInput,
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
  }: ConverterOptions<B>,
): ConversionResult<B> | 0 => {
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

const getBigNumber = (value: ConversionInput, base?: number): BigNumber => {
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

const addCurrencies = <B extends NumericBase | undefined = undefined>(
  a: ConversionInput,
  b: ConversionInput,
  options: ConverterOptions<B> & { aBase?: number; bBase?: number } = {},
): ConversionResult<B> => {
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

const subtractCurrencies = <B extends NumericBase | undefined = undefined>(
  a: ConversionInput,
  b: ConversionInput,
  options: ConverterOptions<B> & { aBase?: number; bBase?: number } = {},
): ConversionResult<B> => {
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

const multiplyCurrencies = <B extends NumericBase | undefined = undefined>(
  a: ConversionInput,
  b: ConversionInput,
  options: ConverterOptions<B> & {
    multiplicandBase?: number;
    multiplierBase?: number;
  } = {},
): ConversionResult<B> => {
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

  return firstValue.gt(secondValue);
};

const conversionLessThan = (
  { ...firstProps }: ConverterInput,
  { ...secondProps }: ConverterInput,
): boolean => {
  const firstValue = converter({ ...firstProps });
  const secondValue = converter({ ...secondProps });

  return firstValue.lt(secondValue);
};

const conversionMax = (
  { ...firstProps }: ConverterInput,
  { ...secondProps }: ConverterInput,
): ConversionInput => {
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
  return firstValue.isGreaterThanOrEqualTo(secondValue);
};

const conversionLTE = (
  { ...firstProps }: ConverterInput,
  { ...secondProps }: ConverterInput,
): boolean => {
  const firstValue = converter({ ...firstProps });
  const secondValue = converter({ ...secondProps });
  return firstValue.isLessThanOrEqualTo(secondValue);
};

const toNegative = <B extends NumericBase | undefined = undefined>(
  n: ConversionInput,
  options: ConverterOptions<B> & {
    multiplicandBase?: number;
    multiplierBase?: number;
  } = {},
): ConversionResult<B> => multiplyCurrencies(n, -1, options);

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
