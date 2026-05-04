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

/**
 * Defines the base type of numeric value
 */
type NumericBase = 'hex' | 'dec' | 'BN';

/**
 * Defines which type of denomination a value is in
 */
type EthDenomination = 'WEI' | 'GWEI' | 'ETH';

interface ConverterParams {
  value: string | number | BigNumber | BN;
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

interface ConversionUtilOptions {
  fromCurrency?: string | null;
  toCurrency?: string | null;
  fromNumericBase?: NumericBase;
  toNumericBase?: NumericBase;
  fromDenomination?: EthDenomination;
  toDenomination?: EthDenomination;
  numberOfDecimals?: number;
  conversionRate?: number | null;
  invertConversionRate?: boolean;
}

interface CurrencyOptions {
  aBase?: number;
  bBase?: number;
  toNumericBase?: NumericBase;
  numberOfDecimals?: number;
  fromDenomination?: EthDenomination;
  toDenomination?: EthDenomination;
}

interface MultiplyOptions {
  multiplicandBase?: number;
  multiplierBase?: number;
  toNumericBase?: NumericBase;
  numberOfDecimals?: number;
}

// Big Number Constants
const BIG_NUMBER_WEI_MULTIPLIER = new BigNumber('1000000000000000000');
const BIG_NUMBER_GWEI_MULTIPLIER = new BigNumber('1000000000');
const BIG_NUMBER_ETH_MULTIPLIER = new BigNumber('1');

// Setter Maps
const toBigNumber: Record<NumericBase, (n: string | number | BigNumber | BN) => BigNumber> = {
  hex: (n) => new BigNumber(stripHexPrefix(n as string), 16),
  dec: (n) => new BigNumber(String(n), 10),
  BN: (n) => new BigNumber((n as BN).toString(16), 16),
};
const toNormalizedDenomination: Record<EthDenomination, (bigNumber: BigNumber) => BigNumber> = {
  WEI: (bigNumber) => bigNumber.div(BIG_NUMBER_WEI_MULTIPLIER),
  GWEI: (bigNumber) => bigNumber.div(BIG_NUMBER_GWEI_MULTIPLIER),
  ETH: (bigNumber) => bigNumber.div(BIG_NUMBER_ETH_MULTIPLIER),
};
const toSpecifiedDenomination: Record<EthDenomination, (bigNumber: BigNumber) => BigNumber> = {
  WEI: (bigNumber) =>
    bigNumber.times(BIG_NUMBER_WEI_MULTIPLIER).decimalPlaces(0),
  GWEI: (bigNumber) =>
    bigNumber.times(BIG_NUMBER_GWEI_MULTIPLIER).decimalPlaces(9),
  ETH: (bigNumber) =>
    bigNumber.times(BIG_NUMBER_ETH_MULTIPLIER).decimalPlaces(9),
};
const baseChange: Record<string, (n: BigNumber) => string | BN> = {
  hex: (n) => n.toString(16),
  dec: (n) => new BigNumber(n).toString(10),
  BN: (n) => new BN(n.toString(16)),
};

// Utility function for checking base types
const isValidBase = (base: number): boolean => Number.isInteger(base) && base > 1;

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
}: ConverterParams): string | number | BigNumber | BN => {
  let convertedValue: BigNumber | string | number | BN = fromNumericBase
    ? toBigNumber[fromNumericBase](value)
    : (value as BigNumber);

  if (fromDenomination) {
    convertedValue = toNormalizedDenomination[fromDenomination](convertedValue as BigNumber);
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
    convertedValue = (convertedValue as BigNumber).times(rate);
  }

  if (toDenomination) {
    convertedValue = toSpecifiedDenomination[toDenomination](convertedValue as BigNumber);
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
  return convertedValue;
};

const conversionUtil = (
  value: string | number | BigNumber | BN | null | undefined,
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
): string | number | BigNumber | BN => {
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

const getBigNumber = (value: string | number | BigNumber, base: number): BigNumber => {
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
  a: string | number | BigNumber,
  b: string | number | BigNumber,
  options: CurrencyOptions = {},
): string | number | BigNumber | BN => {
  const { aBase, bBase, ...conversionOptions } = options;

  if (!isValidBase(aBase!) || !isValidBase(bBase!)) {
    throw new Error('Must specify valid aBase and bBase');
  }
  const value = getBigNumber(a, aBase!).plus(getBigNumber(b, bBase!));

  return converter({
    value,
    ...conversionOptions,
  });
};

const subtractCurrencies = (
  a: string | number | BigNumber,
  b: string | number | BigNumber,
  options: CurrencyOptions = {},
): string | number | BigNumber | BN => {
  const { aBase, bBase, ...conversionOptions } = options;

  if (!isValidBase(aBase!) || !isValidBase(bBase!)) {
    throw new Error('Must specify valid aBase and bBase');
  }

  const value = getBigNumber(a, aBase!).minus(getBigNumber(b, bBase!));

  return converter({
    value,
    ...conversionOptions,
  });
};

const multiplyCurrencies = (
  a: string | number | BigNumber,
  b: string | number | BigNumber,
  options: MultiplyOptions = {},
): string | number | BigNumber | BN => {
  const { multiplicandBase, multiplierBase, ...conversionOptions } = options;

  if (!isValidBase(multiplicandBase!) || !isValidBase(multiplierBase!)) {
    throw new Error('Must specify valid multiplicandBase and multiplierBase');
  }

  const value = getBigNumber(a, multiplicandBase!).times(
    getBigNumber(b, multiplierBase!),
  );

  return converter({
    value,
    ...conversionOptions,
  });
};

const conversionGreaterThan = (
  firstProps: ConverterParams,
  secondProps: ConverterParams,
): boolean => {
  const firstValue = converter({ ...firstProps });
  const secondValue = converter({ ...secondProps });

  return (firstValue as BigNumber).gt(secondValue as BigNumber);
};

const conversionLessThan = (
  firstProps: ConverterParams,
  secondProps: ConverterParams,
): boolean => {
  const firstValue = converter({ ...firstProps });
  const secondValue = converter({ ...secondProps });

  return (firstValue as BigNumber).lt(secondValue as BigNumber);
};

const conversionMax = (
  firstProps: ConverterParams,
  secondProps: ConverterParams,
): string | number | BigNumber | BN => {
  const firstIsGreater = conversionGreaterThan(
    { ...firstProps },
    { ...secondProps },
  );

  return firstIsGreater ? firstProps.value : secondProps.value;
};

const conversionGTE = (
  firstProps: ConverterParams,
  secondProps: ConverterParams,
): boolean => {
  const firstValue = converter({ ...firstProps });
  const secondValue = converter({ ...secondProps });
  return (firstValue as BigNumber).greaterThanOrEqualTo(secondValue as BigNumber);
};

const conversionLTE = (
  firstProps: ConverterParams,
  secondProps: ConverterParams,
): boolean => {
  const firstValue = converter({ ...firstProps });
  const secondValue = converter({ ...secondProps });
  return (firstValue as BigNumber).lessThanOrEqualTo(secondValue as BigNumber);
};

const toNegative = (
  n: string | number | BigNumber,
  options: MultiplyOptions = {},
): string | number | BigNumber | BN => multiplyCurrencies(n, -1, options);

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
