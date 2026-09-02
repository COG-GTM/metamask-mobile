/**
 * Collection of utility functions for consistent formatting and conversion
 */
import { stripHexPrefix, type BN as BN5 } from 'ethereumjs-util';
import BN4 from 'bnjs4';
import { utils as ethersUtils } from 'ethers';
import convert from '@metamask/ethjs-unit';
import { add0x, remove0x, type Hex } from '@metamask/utils';
import numberToBN from 'number-to-bn';
import BigNumber from 'bignumber.js';

import currencySymbols from '../currency-symbols.json';
import { isZero } from '../lodash';
import { regex } from '../regex';

const MAX_DECIMALS_FOR_TOKENS = 36;
BigNumber.config({ DECIMAL_PLACES: MAX_DECIMALS_FOR_TOKENS });

// Big Number Constants
const BIG_NUMBER_WEI_MULTIPLIER = new BigNumber('1000000000000000000');
const BIG_NUMBER_GWEI_MULTIPLIER = new BigNumber('1000000000');
const BIG_NUMBER_ETH_MULTIPLIER = new BigNumber('1');

/**
 * A numeric base a value can be represented in.
 */
type NumericBase = 'hex' | 'dec' | 'BN';

/**
 * An ETH denomination a value can be represented in.
 */
type EthDenomination = 'WEI' | 'GWEI' | 'ETH';

/**
 * Any of the numeric representations accepted by the helpers in this module.
 */
type NumericValue = string | number | BN4 | BN5 | BigNumber;

/**
 * Anything exposing a radix-aware `toString`, which is all these helpers need
 * from the various big-number implementations used across the app.
 */
interface RadixStringifiable {
  toString(base?: number): string;
}

/**
 * The result of a conversion depends on the options it was called with: a
 * `toNumericBase` of 'hex' or 'dec' produces a string, 'BN' produces a `BN`,
 * and omitting it produces a `BigNumber`. Callers rely on this dynamic shape,
 * so the result stays untyped rather than forcing every call site to narrow it.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ConversionResult = any;

interface ConverterOptions {
  value?: NumericValue;
  fromNumericBase?: NumericBase;
  fromDenomination?: EthDenomination;
  fromCurrency?: string | null;
  toNumericBase?: NumericBase;
  toDenomination?: EthDenomination;
  toCurrency?: string | null;
  numberOfDecimals?: number;
  conversionRate?: NumericValue | null;
  invertConversionRate?: boolean;
  roundDown?: number;
}

const currencySymbolsMap = currencySymbols as Record<string, string>;

/**
 * Converts a hex string to a BN object.
 * Adapt function with non string argument handler
 *
 * @param inputHex - Number represented as a hex string.
 * @returns A BN instance.
 */
export const hexToBN = (inputHex?: string | number | BN4) =>
  typeof inputHex !== 'string'
    ? new BN4(inputHex as number, 16)
    : inputHex
    ? new BN4(remove0x(inputHex), 16)
    : new BN4(0);

/**
 * Converts a BN object to a hex string with a '0x' prefix.
 *
 * @param inputBn - BN instance to convert to a hex string.
 * @returns A '0x'-prefixed hex string.
 */
// TODO: Either fix this lint violation or explain why it's necessary to ignore.
// eslint-disable-next-line @typescript-eslint/naming-convention
export function BNToHex(inputBn: RadixStringifiable) {
  return add0x(inputBn.toString(16));
}

// Setter Maps
export const toBigNumber: Record<NumericBase, (n: NumericValue) => BigNumber> =
  {
    hex: (n) => new BigNumber(stripHexPrefix(n as string), 16),
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
const baseChange: Record<NumericBase, (n: BigNumber) => string | BN4> = {
  hex: (n) => n.toString(16),
  dec: (n) => new BigNumber(n).toString(10),
  BN: (n) => new BN4(n.toString(16)),
};

/**
 * Prefixes a hex string with '0x' or '-0x' and returns it. Idempotent.
 *
 * @param str - The string to prefix.
 * @returns The prefixed string.
 */
export const addHexPrefix = (str: string) => {
  if (typeof str !== 'string' || str.match(regex.hexPrefix)) {
    return str;
  }

  if (str.match(regex.hexPrefix)) {
    return str.replace('0X', '0x');
  }

  if (str.startsWith('-')) {
    return str.replace('-', '-0x');
  }

  return `0x${str}`;
};

/**
 * Converts wei to a different unit
 *
 * @param value - Wei to convert
 * @param unit - Unit to convert to, ether by default
 * @returns String containing the new number
 */
export function fromWei(value: NumericValue = 0, unit = 'ether') {
  return convert.fromWei(value as string | number | BN4, unit);
}

/**
 * Converts token minimal unit to readable string value
 *
 * @param minimalInput - Token minimal unit to convert
 * @param decimals - Token decimals to convert
 * @param isRounding - If true, minimalInput is converted to number and rounded for large numbers.
 * @returns String containing the new number
 */
export function fromTokenMinimalUnit(
  minimalInput: NumericValue,
  decimals: number,
  isRounding = true,
) {
  minimalInput = isRounding ? Number(minimalInput) : minimalInput;
  const prefixedInput = addHexPrefix(
    (minimalInput as RadixStringifiable).toString(16),
  );
  let minimal = safeNumberToBN(prefixedInput);
  const negative = minimal.lt(new BN4(0));
  const base = toBN(Math.pow(10, decimals).toString());

  if (negative) {
    minimal = minimal.mul(negative as unknown as BN4);
  }
  let fraction = minimal.mod(base).toString(10);
  while (fraction.length < decimals) {
    fraction = '0' + fraction;
  }
  fraction = (fraction.match(regex.fractions) as RegExpMatchArray)[1];
  const whole = minimal.div(base).toString(10);
  let value = '' + whole + (fraction === '0' ? '' : '.' + fraction);
  if (negative) {
    value = '-' + value;
  }
  return value;
}

/**
 * Converts token minimal unit to readable string value
 *
 * @param minimalInput - Token minimal unit to convert
 * @param decimals - Token decimals to convert
 * @returns String containing the new number
 */
export function fromTokenMinimalUnitString(
  minimalInput: string,
  decimals: number,
) {
  if (typeof minimalInput !== 'string') {
    throw new TypeError('minimalInput must be a string');
  }

  const tokenFormat = ethersUtils.formatUnits(minimalInput, decimals);
  const isInteger = Boolean(regex.integer.exec(tokenFormat));

  const [integerPart, decimalPart] = tokenFormat.split('.');
  if (isInteger) {
    return integerPart;
  }
  return `${integerPart}.${decimalPart}`;
}

/**
 * Converts some unit to token minimal unit
 *
 * @param tokenValue - Value to convert
 * @param decimals - Unit to convert from, ether by default
 * @returns BN instance containing the new number
 */
export function toTokenMinimalUnit(tokenValue: NumericValue, decimals: number) {
  const base = toBN(Math.pow(10, decimals).toString());
  let value = convert.numberToString(tokenValue as string | number | BN4);
  const negative = value.substring(0, 1) === '-';
  if (negative) {
    value = value.substring(1);
  }
  if (value === '.') {
    throw new Error(
      '[number] while converting number ' +
        tokenValue +
        ' to token minimal util, invalid value',
    );
  }
  // Split it into a whole and fractional part
  const comps = value.split('.');
  if (comps.length > 2) {
    throw new Error(
      '[number] while converting number ' +
        tokenValue +
        ' to token minimal util,  too many decimal points',
    );
  }
  let whole: string = comps[0],
    fraction: string = comps[1];
  if (!whole) {
    whole = '0';
  }
  if (!fraction) {
    fraction = '';
  }
  if (fraction.length > decimals) {
    throw new Error(
      '[number] while converting number ' +
        tokenValue +
        ' to token minimal util, too many decimal places',
    );
  }
  while (fraction.length < decimals) {
    fraction += '0';
  }
  const wholeBN = new BN4(whole);
  const fractionBN = new BN4(fraction);
  let tokenMinimal = wholeBN.mul(base).add(fractionBN);
  if (negative) {
    tokenMinimal = tokenMinimal.mul(negative as unknown as BN4);
  }
  return new BN4(tokenMinimal.toString(10), 10);
}

/**
 * Converts some token minimal unit to render format string, showing 5 decimals
 *
 * @param tokenValue - Token value to convert
 * @param decimals - Token decimals to convert
 * @param decimalsToShow - Decimals to 5
 * @returns Number of token minimal unit, in render format
 * If value is less than 5 precision decimals will show '< 0.00001'
 */
export function renderFromTokenMinimalUnit(
  tokenValue: NumericValue | null | undefined,
  decimals: number,
  decimalsToShow = 5,
) {
  const minimalUnit = fromTokenMinimalUnit(tokenValue || 0, decimals);
  const minimalUnitNumber = parseFloat(minimalUnit);
  let renderMinimalUnit;
  if (minimalUnitNumber < 0.00001 && minimalUnitNumber > 0) {
    renderMinimalUnit = '< 0.00001';
  } else {
    const base = Math.pow(10, decimalsToShow);
    renderMinimalUnit = (
      Math.round(minimalUnitNumber * base) / base
    ).toString();
  }
  return renderMinimalUnit;
}

/**
 * Converts two fiat amounts into one with their respective currency, showing up to 5 decimals
 *
 * @param transferFiat - Number representing fiat value of a transfer
 * @param feeFiat - Number representing fiat value of transaction fee
 * @param currentCurrency - Currency
 * @param decimalsToShow - Defaults to 5
 * @returns Formatted fiat value of the addition, in render format
 * If value is less than 5 precision decimals will show '< 0.00001'
 */
export function renderFiatAddition(
  transferFiat: number,
  feeFiat: number,
  currentCurrency: string,
  decimalsToShow = 5,
) {
  const addition = transferFiat + feeFiat;
  let renderMinimalUnit;
  if (addition < 0.00001 && addition > 0) {
    renderMinimalUnit = '< 0.00001';
  } else {
    const base = Math.pow(10, decimalsToShow);
    renderMinimalUnit = (Math.round(addition * base) / base).toString();
  }
  if (currencySymbolsMap[currentCurrency]) {
    return `${currencySymbolsMap[currentCurrency]}${renderMinimalUnit}`;
  }
  return `${renderMinimalUnit} ${currentCurrency}`;
}

/**
 * Limits a number to a max decimal places.
 */
export function limitToMaximumDecimalPlaces(num: number, maxDecimalPlaces = 5) {
  if (isNaN(num) || isNaN(maxDecimalPlaces)) {
    return num;
  }
  const base = Math.pow(10, maxDecimalPlaces);
  return (Math.round(num * base) / base).toString();
}

/**
 * Converts fiat number as human-readable fiat string to token miniml unit expressed as a BN
 *
 * @param fiat - Fiat number
 * @param conversionRate - ETH to current currency conversion rate
 * @param exchangeRate - Asset to ETH conversion rate
 * @param decimals - Asset decimals
 * @returns The converted balance as BN instance
 */
export function fiatNumberToTokenMinimalUnit(
  fiat: number | string,
  conversionRate: number,
  exchangeRate: number,
  decimals: number,
) {
  const floatFiatConverted =
    parseFloat(fiat as string) / (conversionRate * exchangeRate);
  const base = Math.pow(10, decimals);
  const weiNumber = (floatFiatConverted * base).toLocaleString('fullwide', {
    useGrouping: false,
  });
  const weiBN = safeNumberToBN(weiNumber);
  return weiBN;
}

/**
 * Converts wei to render format string, showing 5 decimals
 *
 * @param value - Wei to convert
 * @param decimalsToShow - Decimals to 5
 * @returns Number of token minimal unit, in render format
 * If value is less than 5 precision decimals will show '< 0.00001'
 */
export function renderFromWei(
  value: NumericValue | null | undefined,
  decimalsToShow = 5,
) {
  let renderedWei = '0';
  // avoid undefined
  if (value) {
    const wei = fromWei(value);
    const weiNumber = parseFloat(wei);
    if (weiNumber < 0.00001 && weiNumber > 0) {
      renderedWei = '< 0.00001';
    } else {
      const base = Math.pow(10, decimalsToShow);
      renderedWei = (Math.round(weiNumber * base) / base).toString();
    }
  }
  return renderedWei;
}

/**
 * Converts token BN value to hex string number to be sent
 *
 * @param value - BN instance to convert
 * @param decimals - Decimals to be considered on the conversion
 * @returns String of the hex token value
 */
export function calcTokenValueToSend(value: BN4 | number, decimals: number) {
  return value ? ((value as number) * Math.pow(10, decimals)).toString(16) : 0;
}

/**
 * Checks if a value is a BN instance
 *
 * @param value - Value to check
 * @returns True if the value is a BN instance
 */
export function isBN(value: unknown) {
  return BN4.isBN(value);
}

/**
 * Determines if a string is a valid decimal
 *
 * @param value - String to check
 * @returns True if the string is a valid decimal
 */
export function isDecimal(value: number | string) {
  return (
    Number.isFinite(parseFloat(value as string)) &&
    !Number.isNaN(parseFloat(value as string)) &&
    !isNaN(+value)
  );
}

/**
 * Creates a BN object from a string
 *
 * @param value - Some numeric value represented as a string
 * @returns BN instance
 */
export function toBN(value: string | number | BN4) {
  return new BN4(value);
}

/**
 * Determines if a string is a valid number
 *
 * @param str - Number string
 * @returns True if the string  is a valid number
 */
export function isNumber(str?: string | null) {
  return regex.number.test(str as string);
}

/**
 * Determines if a value is a number
 *
 * @param value - Value to check
 * @returns True if the value is a valid number
 */
export function isNumberValue(value: number | string | null | undefined) {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === 'number') {
    return !Number.isNaN(value) && Number.isFinite(value);
  }

  return isDecimal(value);
}

export const dotAndCommaDecimalFormatter = (value: number | string) => {
  const valueStr = String(value);

  const formattedValue = valueStr.replace(',', '.');

  return formattedValue;
};

/**
 * Determines whether the given number is going to be
 * displalyed in scientific notation after being converted to a string.
 *
 * @param value - The value to check.
 * @returns True if the value is a number in scientific notation, false otherwise.
 * @see https://262.ecma-international.org/5.1/#sec-9.8.1
 */

export const isNumberScientificNotationWhenString = (value: unknown) => {
  if (typeof value !== 'number') {
    return false;
  }
  // toLowerCase is needed since E is also valid
  return value.toString().toLowerCase().includes('e');
};

/**
 * Converts some unit to wei
 *
 * @param value - Value to convert
 * @param unit - Unit to convert from, ether by default
 * @returns BN instance containing the new number
 */
export function toWei(value: NumericValue, unit = 'ether') {
  // check the posibilty to convert to BN
  // directly on the swaps screen
  if (isNumberScientificNotationWhenString(value)) {
    value = (value as number).toFixed(18);
  }
  return convert.toWei(value as string | number | BN4, unit);
}

/**
 * Converts some unit to Gwei
 *
 * @param value - Value to convert
 * @param unit - Unit to convert from, ether by default
 * @returns BN instance containing the new number
 */
export function toGwei(value: NumericValue, unit = 'ether') {
  return (fromWei(value, unit) as unknown as number) * 1000000000;
}

/**
 * Converts some unit to Gwei and return it in render format
 *
 * @param value - Value to convert
 * @param unit - Unit to convert from, ether by default
 * @returns String instance containing the renderable number
 */
export function renderToGwei(value: NumericValue, unit = 'ether') {
  const gwei = (fromWei(value, unit) as unknown as number) * 1000000000;
  let gweiFixed = parseFloat(Math.round(gwei) as unknown as string);
  gweiFixed = isNaN(gweiFixed) ? 0 : gweiFixed;
  return gweiFixed;
}

/**
 * Converts wei expressed as a BN instance into a human-readable fiat string
 * TODO: wei should be a BN instance, but we're not sure if it's always the case
//
 * @param wei - BN corresponding to an amount of wei
 * @param conversionRate - ETH to current currency conversion rate
 * @param currencyCode - Current currency code to display
 * @returns Currency-formatted string
 */
export function weiToFiat(
  wei: NumericValue | null | undefined,
  conversionRate: number | null = null,
  currencyCode?: string,
  decimalsToShow: number | undefined = 5,
): string {
  // Historically returns `undefined` when there is no conversion rate; call
  // sites treat the result as a string.
  if (!conversionRate) return undefined as unknown as string;
  if (!wei || !isBN(wei) || !conversionRate) {
    return addCurrencySymbol(0, currencyCode);
  }
  decimalsToShow = (currencyCode === 'usd' && 2) || undefined;
  const value = weiToFiatNumber(wei, conversionRate, decimalsToShow);
  return addCurrencySymbol(value, currencyCode);
}

/**
 * Renders fiat amount with currency symbol if exists
 *
 * @param amount  Number corresponding to a currency amount
 * @param currencyCode Current currency code to display
 * @returns Currency-formatted string
 */
export function addCurrencySymbol(
  amount: number | string,
  currencyCode?: string,
  extendDecimals = false,
) {
  const prefix = parseFloat(amount as string) < 0 ? '-' : '';
  if (extendDecimals) {
    if (isNumberScientificNotationWhenString(amount)) {
      amount = (amount as number).toFixed(18);
    }

    // if bigger than 0.01, show 2 decimals
    if (Number(amount) >= 0.01 || Number(amount) <= -0.01) {
      amount = parseFloat(amount as string).toFixed(2);
    }

    // if less than 0.01, show all the decimals that are zero except the trailing zeros, and 3 decimals for the rest that are not zero
    if (
      (Number(amount) < 0.01 && Number(amount) > 0) ||
      (Number(amount) > -0.01 && Number(amount) < 0)
    ) {
      const decimalString = amount.toString().split('.')[1];
      if (decimalString && decimalString.length > 1) {
        const firstNonZeroDecimal = decimalString.indexOf(
          (decimalString.match(regex.decimalString) as RegExpMatchArray)[0],
        );
        if (firstNonZeroDecimal > 0) {
          amount = parseFloat(amount as string).toFixed(
            firstNonZeroDecimal + 3,
          );
          // remove trailing zeros
          amount = amount.replace(regex.trailingZero, '');
        }
      }
    }
  }

  if (currencyCode === 'usd' && !extendDecimals) {
    amount = parseFloat(amount as string).toFixed(2);
  }

  const amountString = amount.toString();
  const absAmountStr = amountString.startsWith('-')
    ? amountString.slice(1) // Remove the first character if it's a '-'
    : amountString;

  if (currencySymbolsMap[currencyCode as string]) {
    return `${prefix}${
      currencySymbolsMap[currencyCode as string]
    }${absAmountStr}`;
  }

  const lowercaseCurrencyCode = currencyCode?.toLowerCase();

  if (currencySymbolsMap[lowercaseCurrencyCode as string]) {
    return `${prefix}${
      currencySymbolsMap[lowercaseCurrencyCode as string]
    }${absAmountStr}`;
  }

  return `${prefix}${absAmountStr} ${currencyCode}`;
}

/**
 * Converts wei expressed as a BN instance into a human-readable fiat string
 *
 * @param wei - BN corresponding to an amount of wei
 * @param conversionRate - ETH to current currency conversion rate
 * @param decimalsToShow - Decimals to 5
 * @returns The converted balance
 */
export function weiToFiatNumber(
  wei: NumericValue,
  conversionRate: number,
  decimalsToShow: number | undefined = 5,
) {
  const base = Math.pow(10, decimalsToShow);
  const eth = fromWei(wei).toString();
  let value = parseFloat(
    (Math.floor((eth as unknown as number) * conversionRate * base) /
      base) as unknown as string,
  );
  value = isNaN(value) ? 0.0 : value;
  return value;
}

/**
 * Handles wie input to have less or equal to 18 decimals
 *
 * @param wei - Amount in decimal notation
 * @returns Number string with less or equal 18 decimals
 */
export function handleWeiNumber(wei: string) {
  const comps = wei.split('.');
  let fraction = comps[1];
  if (fraction && fraction.length > 18) fraction = fraction.substring(0, 18);
  const finalWei = fraction ? [comps[0], fraction].join('.') : comps[0];
  return finalWei;
}

/**
 * Converts fiat number as human-readable fiat string to wei expressed as a BN
 *
 * @param fiat - Fiat number
 * @param conversionRate - ETH to current currency conversion rate
 * @returns The converted balance as BN instance
 */
export function fiatNumberToWei(fiat: number | string, conversionRate: number) {
  const floatFiatConverted = parseFloat(fiat as string) / conversionRate;
  if (
    !floatFiatConverted ||
    isNaN(floatFiatConverted) ||
    floatFiatConverted === Infinity
  ) {
    return '0x0';
  }
  const base = Math.pow(10, 18);
  const weiNumber = Math.trunc(base * floatFiatConverted).toLocaleString(
    'fullwide',
    { useGrouping: false },
  );
  const weiBN = safeNumberToBN(weiNumber);
  return weiBN;
}

/**
 * Wraps 'numberToBN' method to avoid potential undefined and decimal values
 *
 * @param value -  number
 * @returns The converted value as BN instance
 */
export function safeNumberToBN(value: number | string | BN4) {
  try {
    const safeValue = fastSplit(value?.toString()) || '0';
    return numberToBN(safeValue);
  } catch {
    return numberToBN('0');
  }
}

/**
 * Performs a fast string split and returns the first item of the string based on the divider provided
 *
 * @param value -  number/string to be splitted
 * @param divider -  string value to use to split the string (default '.')
 * @returns the selected splitted element
 */

export function fastSplit(value: string, divider = '.') {
  const [from, to] = [value.indexOf(divider), 0];
  return value.substring(from, to) || value;
}

/**
 * Calculates fiat balance of an asset
 *
 * @param balance - Number corresponding to a balance of an asset
 * @param conversionRate - ETH to current currency conversion rate
 * @param exchangeRate - Asset to ETH conversion rate
 * @param currencyCode - Current currency code to display
 * @returns Currency-formatted string
 */
export function balanceToFiat(
  balance: number | string | undefined | null,
  conversionRate: number | null | undefined,
  exchangeRate: number | undefined,
  currencyCode: string,
) {
  if (
    balance === undefined ||
    balance === null ||
    exchangeRate === undefined ||
    conversionRate === undefined ||
    exchangeRate === 0
  ) {
    return undefined;
  }
  const fiatFixed = balanceToFiatNumber(
    balance,
    conversionRate as number,
    exchangeRate,
  );
  return addCurrencySymbol(fiatFixed, currencyCode);
}

/**
 * Calculates fiat balance of an asset and returns a number
 *
 * @param balance - Number or string corresponding to a balance of an asset
 * @param conversionRate - ETH to current currency conversion rate
 * @param exchangeRate - Asset to ETH conversion rate
 * @param decimalsToShow - Decimals to 5
 * @returns The converted balance
 */
export function balanceToFiatNumber(
  balance: number | string,
  conversionRate: number,
  exchangeRate?: number,
  decimalsToShow = 5,
) {
  const base = Math.pow(10, decimalsToShow);
  let fiatFixed = parseFloat(
    (Math.floor(
      (balance as number) * conversionRate * (exchangeRate as number) * base,
    ) / base) as unknown as string,
  );
  fiatFixed = isNaN(fiatFixed) ? 0.0 : fiatFixed;
  return fiatFixed;
}

export function getCurrencySymbol(currencyCode: string) {
  if (currencySymbolsMap[currencyCode]) {
    return `${currencySymbolsMap[currencyCode]}`;
  }
  return currencyCode;
}

/**
 * Formats a fiat value into a string ready to be rendered
 *
 * @param value - number corresponding to a balance of an asset
 * @param currencyCode - Current currency code to display
 * @param decimalsToShow - Decimals to 5
 * @returns The converted balance
 */
export function renderFiat(
  value: number,
  currencyCode: string,
  decimalsToShow = 5,
) {
  const base = Math.pow(10, decimalsToShow);
  let fiatFixed = parseFloat(
    (Math.round(value * base) / base) as unknown as string,
  );
  fiatFixed = isNaN(fiatFixed) ? 0.0 : fiatFixed;
  if (currencySymbolsMap[currencyCode]) {
    return `${currencySymbolsMap[currencyCode]}${fiatFixed}`;
  }
  return `${fiatFixed} ${currencyCode.toUpperCase()}`;
}

/**
 * Converts BN wei value to wei units in string format
 *
 * @param value - Object containing wei value in BN format
 * @returns Corresponding wei value
 */
export function renderWei(value: NumericValue) {
  if (!value) return '0';
  const wei = fromWei(value);
  const weiUnits = (wei as unknown as number) * Math.pow(10, 18);
  return weiUnits.toString();
}
/**
 * Format a string number in an string number with at most 5 decimal places
 *
 * @param number - String containing a number
 * @returns String number with none or at most 5 decimal places
 */
export function renderNumber(number: string) {
  const index = number.indexOf('.');
  if (index === 0) return number;
  return number.substring(0, index + 6);
}

/**
 * Checks whether the given value is a 0x-prefixed, non-zero, non-zero-padded,
 * hexadecimal string.
 *
 * @param value - The value to check.
 * @returns True if the value is a correctly formatted hex string,
 * false otherwise.
 */
export function isPrefixedFormattedHexString(value: unknown) {
  if (typeof value !== 'string') {
    return false;
  }
  return regex.prefixedFormattedHexString.test(value);
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
}: ConverterOptions): ConversionResult => {
  let convertedValue: BigNumber = fromNumericBase
    ? toBigNumber[fromNumericBase](value as NumericValue)
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
      rate = new BigNumber(1.0).div(conversionRate as BigNumber.Value);
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

export const conversionUtil = (
  value: NumericValue | null | undefined,
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
  }: ConverterOptions,
): ConversionResult =>
  converter({
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

export const toHexadecimal = (decimal?: NumericValue | null): Hex => {
  // Falsy values are passed through unchanged; call sites treat the result as a
  // hexadecimal string.
  if (!decimal) return decimal as Hex;
  if ((decimal as unknown) !== typeof 'string') {
    decimal = String(decimal);
  }
  if ((decimal as string).startsWith('0x')) return decimal as Hex;
  return toBigNumber.dec(decimal).toString(16) as Hex;
};

export const calculateEthFeeForMultiLayer = ({
  multiLayerL1FeeTotal,
  ethFee = 0,
}: {
  multiLayerL1FeeTotal?: string | null;
  ethFee?: number | string;
}) => {
  if (!multiLayerL1FeeTotal) {
    return ethFee;
  }
  const multiLayerL1FeeTotalDecEth = conversionUtil(multiLayerL1FeeTotal, {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
    fromDenomination: 'WEI',
    toDenomination: 'ETH',
  });
  return new BigNumber(multiLayerL1FeeTotalDecEth)
    .plus(new BigNumber(ethFee ?? 0))
    .toString(10);
};

/**
 *
 * @param value - Value to check
 * @returns true if value is zero
 */
export const isZeroValue = (value: NumericValue | null | undefined) => {
  if (value === null || value === undefined) {
    return false;
  }
  return (
    value === '0x0' || (isBN(value) && (value as BN4).isZero()) || isZero(value)
  );
};

export const formatValueToMatchTokenDecimals = (
  value?: string | null,
  decimal?: number | string | null,
) => {
  if (value === null || value === undefined) {
    return value;
  }
  const decimalIndex = value.indexOf('.');
  if (decimalIndex !== -1) {
    const fractionalLength = value.substring(decimalIndex + 1).length;
    if (fractionalLength > Number(decimal)) {
      value = parseFloat(value).toFixed(Number(decimal));
    }
  }
  return value;
};

export const safeBNToHex = (value: RadixStringifiable | null | undefined) => {
  if (value === null || value === undefined) {
    return value;
  }

  return BNToHex(value);
};

/**
 * Formats a potentially large number to the nearest unit.
 * e.g. 1T for trillions, 2.3B for billions, 4.56M for millions, 7,890 for thousands, etc.
 *
 * @param t - An I18nContext translator.
 * @param number - The number to format.
 * @returns A localized string of the formatted number + unit.
 */
export const localizeLargeNumber = (
  i18nInstance: { t: unknown },
  number: number,
) => {
  const i18n = i18nInstance as { t: (key: string) => string };
  const oneTrillion = 1000000000000;
  const oneBillion = 1000000000;
  const oneMillion = 1000000;

  if (number >= oneTrillion) {
    return `${(number / oneTrillion).toFixed(2)}${i18n.t(
      'token.trillion_abbreviation',
    )}`;
  } else if (number >= oneBillion) {
    return `${(number / oneBillion).toFixed(2)}${i18n.t(
      'token.billion_abbreviation',
    )}`;
  } else if (number >= oneMillion) {
    return `${(number / oneMillion).toFixed(2)}${i18n.t(
      'token.million_abbreviation',
    )}`;
  }
  return number.toFixed(2);
};

export const convertDecimalToPercentage = (decimal: number) => {
  if (typeof decimal !== 'number' || isNaN(decimal)) {
    throw new Error('Input must be a valid number');
  }
  return (decimal * 100).toFixed(2) + '%';
};
