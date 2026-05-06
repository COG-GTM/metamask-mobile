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

// Big Number Constants
const BIG_NUMBER_WEI_MULTIPLIER = new BigNumber('1000000000000000000');
const BIG_NUMBER_GWEI_MULTIPLIER = new BigNumber('1000000000');
const BIG_NUMBER_ETH_MULTIPLIER = new BigNumber('1');

type NumericBase = 'hex' | 'dec' | 'BN';
type EthDenomination = 'WEI' | 'GWEI' | 'ETH';
type InputValue = string | number | BigNumber | BN;

// Setter Maps
const toBigNumber: Record<NumericBase, (n: InputValue) => BigNumber> = {
  hex: (n) => new BigNumber(stripHexPrefix(String(n)), 16),
  dec: (n) => new BigNumber(String(n), 10),
  BN: (n) => new BigNumber((n as BN).toString(16), 16),
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
const isValidBase = (base: unknown): base is number =>
  Number.isInteger(base) && (base as number) > 1;

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
interface ConverterOptions {
  value: InputValue;
  fromNumericBase?: NumericBase;
  fromDenomination?: EthDenomination;
  fromCurrency?: string | null;
  toNumericBase?: NumericBase;
  toDenomination?: EthDenomination;
  toCurrency?: string | null;
  numberOfDecimals?: number;
  conversionRate?: number | string | null;
  invertConversionRate?: boolean;
  roundDown?: number;
}

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
}: ConverterOptions): BigNumber | string | BN => {
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
    let rate = toBigNumber.dec(conversionRate as number);
    if (invertConversionRate) {
      rate = new BigNumber(1.0).div(conversionRate as number);
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
    return baseChange[toNumericBase](convertedValue);
  }
  return convertedValue;
};

interface ConversionUtilOptions {
  fromCurrency?: string | null;
  toCurrency?: string | null;
  fromNumericBase?: NumericBase;
  toNumericBase?: NumericBase;
  fromDenomination?: EthDenomination;
  toDenomination?: EthDenomination;
  numberOfDecimals?: number;
  conversionRate?: number | string | null;
  invertConversionRate?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const conversionUtil = (
  value: InputValue | undefined,
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
  }: ConversionUtilOptions,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any => {
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

const getBigNumber = (value: InputValue, base: number): BigNumber => {
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

interface AddSubtractOptions extends ConversionUtilOptions {
  aBase?: number;
  bBase?: number;
}

interface MultiplyOptions extends ConversionUtilOptions {
  multiplicandBase?: number;
  multiplierBase?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const addCurrencies = (
  a: InputValue,
  b: InputValue,
  options: AddSubtractOptions = {},
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any => {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const subtractCurrencies = (
  a: InputValue,
  b: InputValue,
  options: AddSubtractOptions = {},
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any => {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const multiplyCurrencies = (
  a: InputValue,
  b: InputValue,
  options: MultiplyOptions = {},
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any => {
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
  firstProps: ConverterOptions,
  secondProps: ConverterOptions,
): boolean => {
  const firstValue = converter({ ...firstProps }) as BigNumber;
  const secondValue = converter({ ...secondProps }) as BigNumber;

  return firstValue.gt(secondValue);
};

const conversionLessThan = (
  firstProps: ConverterOptions,
  secondProps: ConverterOptions,
): boolean => {
  const firstValue = converter({ ...firstProps }) as BigNumber;
  const secondValue = converter({ ...secondProps }) as BigNumber;

  return firstValue.lt(secondValue);
};

const conversionMax = (
  firstProps: ConverterOptions,
  secondProps: ConverterOptions,
): InputValue => {
  const firstIsGreater = conversionGreaterThan(
    { ...firstProps },
    { ...secondProps },
  );

  return firstIsGreater ? firstProps.value : secondProps.value;
};

const conversionGTE = (
  firstProps: ConverterOptions,
  secondProps: ConverterOptions,
): boolean => {
  const firstValue = converter({ ...firstProps }) as BigNumber;
  const secondValue = converter({ ...secondProps }) as BigNumber;
  return firstValue.greaterThanOrEqualTo(secondValue);
};

const conversionLTE = (
  firstProps: ConverterOptions,
  secondProps: ConverterOptions,
): boolean => {
  const firstValue = converter({ ...firstProps }) as BigNumber;
  const secondValue = converter({ ...secondProps }) as BigNumber;
  return firstValue.lessThanOrEqualTo(secondValue);
};

const toNegative = (
  n: InputValue,
  options: MultiplyOptions = {},
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any => multiplyCurrencies(n, -1, options);

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
