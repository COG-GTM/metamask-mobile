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
import BN4 from 'bnjs4';

import { stripHexPrefix } from 'ethereumjs-util';

/**
 * Defines the base type of numeric value
 */
export type NumericBase = 'hex' | 'dec' | 'BN';

/**
 * Defines which type of denomination a value is in
 */
export type EthDenomination = 'WEI' | 'GWEI' | 'ETH';

/**
 * The set of value shapes accepted as input by the currency converter.
 */
export type ConvertibleValue = string | number | BigNumber | BN4;

// Big Number Constants
const BIG_NUMBER_WEI_MULTIPLIER = new BigNumber('1000000000000000000');
const BIG_NUMBER_GWEI_MULTIPLIER = new BigNumber('1000000000');
const BIG_NUMBER_ETH_MULTIPLIER = new BigNumber('1');

// Setter Maps
const toBigNumber: Record<NumericBase, (n: ConvertibleValue) => BigNumber> = {
  hex: (n) => new BigNumber(stripHexPrefix(String(n)), 16),
  dec: (n) => new BigNumber(String(n), 10),
  BN: (n) => new BigNumber((n as BN4).toString(16), 16),
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
const baseChange: {
  hex: (n: BigNumber) => string;
  dec: (n: BigNumber) => string;
  BN: (n: BigNumber) => BN4;
} = {
  hex: (n) => n.toString(16),
  dec: (n) => new BigNumber(n).toString(10),
  BN: (n) => new BN4(n.toString(16)),
};

// Utility function for checking base types
const isValidBase = (base: unknown): base is number =>
  Number.isInteger(base) && (base as number) > 1;

interface ConverterOptions {
  value: ConvertibleValue;
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

type ConverterResult = BigNumber | string | BN4;

/**
 * Utility method to convert a value between denominations, formats and currencies.
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
}: ConverterOptions): ConverterResult => {
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
    return baseChange[toNumericBase](convertedValue);
  }
  return convertedValue;
};

type ConversionUtilOptions = Omit<ConverterOptions, 'value'>;

// `conversionUtil` returns a string when callers specify a `toNumericBase`
// (which is the most common usage) and otherwise returns a `BigNumber`. When
// the callers request a currency conversion without providing a rate, it
// short-circuits to `0`. Overloads are provided so callers receive the
// narrowest type possible.
function conversionUtil(
  value: ConvertibleValue | null | undefined,
  options: ConversionUtilOptions & { toNumericBase: 'hex' | 'dec' },
): string;
function conversionUtil(
  value: ConvertibleValue | null | undefined,
  options: ConversionUtilOptions & { toNumericBase: 'BN' },
): BN4;
function conversionUtil(
  value: ConvertibleValue | null | undefined,
  options: ConversionUtilOptions,
): ConverterResult | 0;
function conversionUtil(
  value: ConvertibleValue | null | undefined,
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
): ConverterResult | 0 {
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
}

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

interface ArithmeticOptions extends ConversionUtilOptions {
  aBase: number;
  bBase: number;
}

function addCurrencies(
  a: ConvertibleValue,
  b: ConvertibleValue,
  options: ArithmeticOptions & { toNumericBase: 'hex' | 'dec' },
): string;
function addCurrencies(
  a: ConvertibleValue,
  b: ConvertibleValue,
  options: ArithmeticOptions & { toNumericBase: 'BN' },
): BN4;
function addCurrencies(
  a: ConvertibleValue,
  b: ConvertibleValue,
  options: ArithmeticOptions,
): ConverterResult;
function addCurrencies(
  a: ConvertibleValue,
  b: ConvertibleValue,
  options: ArithmeticOptions,
): ConverterResult {
  const { aBase, bBase, ...conversionOptions } = options;

  if (!isValidBase(aBase) || !isValidBase(bBase)) {
    throw new Error('Must specify valid aBase and bBase');
  }
  const value = getBigNumber(a, aBase).plus(getBigNumber(b, bBase));

  return converter({
    value,
    ...conversionOptions,
  });
}

function subtractCurrencies(
  a: ConvertibleValue,
  b: ConvertibleValue,
  options: ArithmeticOptions & { toNumericBase: 'hex' | 'dec' },
): string;
function subtractCurrencies(
  a: ConvertibleValue,
  b: ConvertibleValue,
  options: ArithmeticOptions & { toNumericBase: 'BN' },
): BN4;
function subtractCurrencies(
  a: ConvertibleValue,
  b: ConvertibleValue,
  options: ArithmeticOptions,
): ConverterResult;
function subtractCurrencies(
  a: ConvertibleValue,
  b: ConvertibleValue,
  options: ArithmeticOptions,
): ConverterResult {
  const { aBase, bBase, ...conversionOptions } = options;

  if (!isValidBase(aBase) || !isValidBase(bBase)) {
    throw new Error('Must specify valid aBase and bBase');
  }

  const value = getBigNumber(a, aBase).minus(getBigNumber(b, bBase));

  return converter({
    value,
    ...conversionOptions,
  });
}

interface MultiplyOptions extends ConversionUtilOptions {
  multiplicandBase: number;
  multiplierBase: number;
}

function multiplyCurrencies(
  a: ConvertibleValue,
  b: ConvertibleValue,
  options: MultiplyOptions & { toNumericBase: 'hex' | 'dec' },
): string;
function multiplyCurrencies(
  a: ConvertibleValue,
  b: ConvertibleValue,
  options: MultiplyOptions & { toNumericBase: 'BN' },
): BN4;
function multiplyCurrencies(
  a: ConvertibleValue,
  b: ConvertibleValue,
  options: MultiplyOptions,
): ConverterResult;
function multiplyCurrencies(
  a: ConvertibleValue,
  b: ConvertibleValue,
  options: MultiplyOptions,
): ConverterResult {
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
}

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
): ConvertibleValue => {
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
  return firstValue.gte(secondValue);
};

const conversionLTE = (
  firstProps: ConverterOptions,
  secondProps: ConverterOptions,
): boolean => {
  const firstValue = converter({ ...firstProps }) as BigNumber;
  const secondValue = converter({ ...secondProps }) as BigNumber;
  return firstValue.lte(secondValue);
};

const toNegative = (
  n: ConvertibleValue,
  options: MultiplyOptions,
): ConverterResult => multiplyCurrencies(n, -1, options);

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
