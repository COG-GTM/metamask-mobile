/* Currency Conversion Utility
 * This utility function can be used for converting currency related values within metamask.
 * The caller should be able to pass it a value, along with information about the value's
 * numeric base, denomination and currency, and the desired numeric base, denomination and
 * currency. It should return a single value.
 *
 * @param value - The value to convert.
 * @param options - Options to specify details of the conversion
 * @param options.fromCurrency - The currency of the passed value
 * @param options.toCurrency - The desired currency of the result
 * @param options.fromNumericBase - The numeric basic of the passed value.
 * @param options.toNumericBase - The desired numeric basic of the result.
 * @param options.fromDenomination - The denomination of the passed value
 * @param options.numberOfDecimals - The desired number of decimals in the result
 * @param options.roundDown - The desired number of decimals to round down to
 * @param options.conversionRate - The rate to use to make the fromCurrency -> toCurrency conversion
 * @returns The converted value.
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
export type NumericValue = string | number | BN | BigNumber;
// Public output of the converter helpers. The `BN` numeric base is unused by
// callers, so results are always a string, number or BigNumber at runtime.
export type ConversionResult = string | number | BigNumber;

interface ConverterOptions {
  value: NumericValue;
  fromNumericBase?: NumericBase;
  fromDenomination?: EthDenomination;
  fromCurrency?: string | null;
  toNumericBase?: NumericBase;
  toDenomination?: EthDenomination;
  toCurrency?: string | null;
  numberOfDecimals?: number;
  conversionRate?: number | null;
  invertConversionRate?: boolean;
  roundDown?: number;
}

type ConverterInput = Omit<ConverterOptions, 'value'>;

interface AddSubtractOptions extends ConverterInput {
  aBase?: number;
  bBase?: number;
}

interface MultiplyOptions extends ConverterInput {
  multiplicandBase?: number;
  multiplierBase?: number;
}

interface ConversionUtilOptions extends ConverterInput {
  conversionRate?: number | null;
}

// Big Number Constants
const BIG_NUMBER_WEI_MULTIPLIER = new BigNumber('1000000000000000000');
const BIG_NUMBER_GWEI_MULTIPLIER = new BigNumber('1000000000');
const BIG_NUMBER_ETH_MULTIPLIER = new BigNumber('1');

// Setter Maps
const toBigNumber: Record<NumericBase, (n: NumericValue) => BigNumber> = {
  hex: (n) => new BigNumber(stripHexPrefix(n as string), 16),
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
const isValidBase = (base?: number): boolean =>
  typeof base === 'number' && Number.isInteger(base) && base > 1;

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
}: ConverterOptions): ConversionResult => {
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
    convertedValue = convertedValue.decimalPlaces(roundDown, BigNumber.ROUND_DOWN);
  }

  if (toNumericBase) {
    return baseChange[toNumericBase](convertedValue) as ConversionResult;
  }
  return convertedValue;
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
  }: ConversionUtilOptions,
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

const getBigNumber = (value: NumericValue, base?: number): BigNumber => {
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
  options: AddSubtractOptions = {},
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
  options: AddSubtractOptions = {},
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
  options: MultiplyOptions = {},
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
): NumericValue => {
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
  n: NumericValue,
  options: MultiplyOptions = {},
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
