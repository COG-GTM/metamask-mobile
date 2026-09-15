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
export type NumericBase = 'hex' | 'dec' | 'BN';

/**
 * Defines which type of denomination a value is in
 */
export type EthDenomination = 'WEI' | 'GWEI' | 'ETH';

/**
 * Values accepted as conversion input. `BigNumber` is only valid when no
 * `fromNumericBase` is given; `BN` only when `fromNumericBase` is `'BN'`.
 */
export type ConversionValue = string | number | BN | BigNumber;

/**
 * Result type of a conversion, derived from the requested `toNumericBase`.
 */
export type ConversionResult<T extends NumericBase | undefined> = T extends 'BN'
  ? BN
  : T extends 'hex' | 'dec'
  ? string
  : BigNumber;

export interface ConversionOptions<
  TBase extends NumericBase | undefined = NumericBase | undefined,
> {
  fromNumericBase?: NumericBase;
  fromDenomination?: EthDenomination;
  fromCurrency?: string | null;
  toNumericBase?: TBase;
  toDenomination?: EthDenomination;
  toCurrency?: string | null;
  numberOfDecimals?: number;
  conversionRate?: number | string | BigNumber | null;
  invertConversionRate?: boolean;
  roundDown?: number;
}

export interface ConverterInput<
  TBase extends NumericBase | undefined = NumericBase | undefined,
> extends ConversionOptions<TBase> {
  value: ConversionValue;
}

export interface AddCurrenciesOptions<
  TBase extends NumericBase | undefined = NumericBase | undefined,
> extends ConversionOptions<TBase> {
  aBase?: number;
  bBase?: number;
}

export interface MultiplyCurrenciesOptions<
  TBase extends NumericBase | undefined = NumericBase | undefined,
> extends ConversionOptions<TBase> {
  multiplicandBase?: number;
  multiplierBase?: number;
}

// Big Number Constants
const BIG_NUMBER_WEI_MULTIPLIER = new BigNumber('1000000000000000000');
const BIG_NUMBER_GWEI_MULTIPLIER = new BigNumber('1000000000');
const BIG_NUMBER_ETH_MULTIPLIER = new BigNumber('1');

// Setter Maps
const toBigNumber: Record<NumericBase, (n: ConversionValue) => BigNumber> = {
  // stripHexPrefix throws for non-strings, matching the original runtime contract for hex input.
  hex: (n) => new BigNumber(stripHexPrefix(n as string), 16),
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
const isValidBase = (base: unknown): base is number =>
  Number.isInteger(base) && (base as number) > 1;

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
const converter = <TBase extends NumericBase | undefined = undefined>({
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
}: ConverterInput<TBase>): ConversionResult<TBase> => {
  // Without a `fromNumericBase` the caller must already supply a BigNumber.
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
    return baseChange[toNumericBase](convertedValue) as ConversionResult<TBase>;
  }
  return convertedValue as ConversionResult<TBase>;
};

/**
 * Without a distinct `toCurrency` the currencies always match, so the
 * `0` fallback below is unreachable and the result is a real conversion.
 */
function conversionUtil<TBase extends NumericBase | undefined = undefined>(
  value: ConversionValue | null | undefined,
  options: ConversionOptions<TBase> & { toCurrency?: undefined },
): ConversionResult<TBase>;
function conversionUtil<TBase extends NumericBase | undefined = undefined>(
  value: ConversionValue | null | undefined,
  options: ConversionOptions<TBase>,
): ConversionResult<TBase> | 0;
function conversionUtil<TBase extends NumericBase | undefined = undefined>(
  value: ConversionValue | null | undefined,
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
  }: ConversionOptions<TBase>,
): ConversionResult<TBase> | 0 {
  if (fromCurrency !== toCurrency && !conversionRate) {
    return 0;
  }
  return converter<TBase>({
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

const getBigNumber = (value: ConversionValue, base: number): BigNumber => {
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

const addCurrencies = <TBase extends NumericBase | undefined = undefined>(
  a: ConversionValue,
  b: ConversionValue,
  options: AddCurrenciesOptions<TBase> = {},
): ConversionResult<TBase> => {
  const { aBase, bBase, ...conversionOptions } = options;

  if (!isValidBase(aBase) || !isValidBase(bBase)) {
    throw new Error('Must specify valid aBase and bBase');
  }
  const value = getBigNumber(a, aBase).plus(getBigNumber(b, bBase));

  return converter<TBase>({
    value,
    ...conversionOptions,
  });
};

const subtractCurrencies = <TBase extends NumericBase | undefined = undefined>(
  a: ConversionValue,
  b: ConversionValue,
  options: AddCurrenciesOptions<TBase> = {},
): ConversionResult<TBase> => {
  const { aBase, bBase, ...conversionOptions } = options;

  if (!isValidBase(aBase) || !isValidBase(bBase)) {
    throw new Error('Must specify valid aBase and bBase');
  }

  const value = getBigNumber(a, aBase).minus(getBigNumber(b, bBase));

  return converter<TBase>({
    value,
    ...conversionOptions,
  });
};

const multiplyCurrencies = <TBase extends NumericBase | undefined = undefined>(
  a: ConversionValue,
  b: ConversionValue,
  options: MultiplyCurrenciesOptions<TBase> = {},
): ConversionResult<TBase> => {
  const { multiplicandBase, multiplierBase, ...conversionOptions } = options;

  if (!isValidBase(multiplicandBase) || !isValidBase(multiplierBase)) {
    throw new Error('Must specify valid multiplicandBase and multiplierBase');
  }

  const value = getBigNumber(a, multiplicandBase).times(
    getBigNumber(b, multiplierBase),
  );

  return converter<TBase>({
    value,
    ...conversionOptions,
  });
};

/**
 * Comparison inputs must not request a numeric base change, so that the
 * converted values remain BigNumbers and can be compared.
 */
type ComparisonInput = ConverterInput<undefined>;

/**
 * bignumber.js v9 no longer exposes these legacy comparison aliases. The two
 * helpers using them are unused and kept verbatim (not fixed) in this typing
 * migration, so the legacy names are modelled here instead.
 */
interface LegacyComparableBigNumber {
  greaterThanOrEqualTo(n: BigNumber): boolean;
  lessThanOrEqualTo(n: BigNumber): boolean;
}

const conversionGreaterThan = (
  { ...firstProps }: ComparisonInput,
  { ...secondProps }: ComparisonInput,
): boolean => {
  const firstValue = converter({ ...firstProps });
  const secondValue = converter({ ...secondProps });

  return firstValue.gt(secondValue);
};

const conversionLessThan = (
  { ...firstProps }: ComparisonInput,
  { ...secondProps }: ComparisonInput,
): boolean => {
  const firstValue = converter({ ...firstProps });
  const secondValue = converter({ ...secondProps });

  return firstValue.lt(secondValue);
};

const conversionMax = (
  { ...firstProps }: ComparisonInput,
  { ...secondProps }: ComparisonInput,
): ConversionValue => {
  const firstIsGreater = conversionGreaterThan(
    { ...firstProps },
    { ...secondProps },
  );

  return firstIsGreater ? firstProps.value : secondProps.value;
};

const conversionGTE = (
  { ...firstProps }: ComparisonInput,
  { ...secondProps }: ComparisonInput,
): boolean => {
  const firstValue = converter({ ...firstProps });
  const secondValue = converter({ ...secondProps });
  return (
    firstValue as unknown as LegacyComparableBigNumber
  ).greaterThanOrEqualTo(secondValue);
};

const conversionLTE = (
  { ...firstProps }: ComparisonInput,
  { ...secondProps }: ComparisonInput,
): boolean => {
  const firstValue = converter({ ...firstProps });
  const secondValue = converter({ ...secondProps });
  return (firstValue as unknown as LegacyComparableBigNumber).lessThanOrEqualTo(
    secondValue,
  );
};

const toNegative = <TBase extends NumericBase | undefined = undefined>(
  n: ConversionValue,
  options: MultiplyCurrenciesOptions<TBase> = {},
): ConversionResult<TBase> => multiplyCurrencies<TBase>(n, -1, options);

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
