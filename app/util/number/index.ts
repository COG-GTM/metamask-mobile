/**
 * Collection of utility functions for consistent formatting and conversion
 */
import { stripHexPrefix } from 'ethereumjs-util';
import BN4 from 'bnjs4';
import type BN from 'bn.js';
import { utils as ethersUtils } from 'ethers';
import convert from '@metamask/ethjs-unit';
import { add0x, remove0x, type Hex } from '@metamask/utils';
import numberToBN from 'number-to-bn';
import BigNumber from 'bignumber.js';

import currencySymbolsJson from '../currency-symbols.json';
import { isZero } from '../lodash';
import { regex } from '../regex';

const currencySymbols = currencySymbolsJson as Record<string, string>;

const MAX_DECIMALS_FOR_TOKENS = 36;
BigNumber.config({ DECIMAL_PLACES: MAX_DECIMALS_FOR_TOKENS });

// Big Number Constants
const BIG_NUMBER_WEI_MULTIPLIER = new BigNumber('1000000000000000000');
const BIG_NUMBER_GWEI_MULTIPLIER = new BigNumber('1000000000');
const BIG_NUMBER_ETH_MULTIPLIER = new BigNumber('1');

/**
 * Any of the BN flavours in use across the app (`bn.js` and `bnjs4` ship
 * structurally compatible, but nominally distinct, types).
 */
export type AnyBN = BN4 | BN;

/**
 * A numeric value in any of the shapes accepted by these helpers.
 */
export type NumericValue = string | number | AnyBN | BigNumber;

/**
 * Defines the base type of a numeric value.
 */
export type NumericBase = 'hex' | 'dec' | 'BN';

/**
 * Defines which type of denomination a value is in.
 */
export type EthDenomination = 'WEI' | 'GWEI' | 'ETH';

/**
 * Converts a hex string to a BN object.
 * Adapt function with non string argument handler
 *
 * @param inputHex - Number represented as a hex string.
 * @returns A BN instance.
 */
export const hexToBN = (
  inputHex: string | number | AnyBN | null | undefined,
): BN4 =>
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
export function BNToHex(inputBn: AnyBN | BigNumber): Hex {
  return add0x(inputBn.toString(16));
}

// Setter Maps
export const toBigNumber: Record<
  NumericBase,
  (n: NumericValue) => BigNumber
> = {
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
export function addHexPrefix(str: string): string;
export function addHexPrefix<ValueType>(str: ValueType): ValueType;
export function addHexPrefix(str: unknown): unknown {
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
}

/**
 * Converts wei to a different unit
 *
 * @param value - Wei to convert
 * @param unit - Unit to convert to, ether by default
 * @returns String containing the new number
 */
export function fromWei(value: NumericValue = 0, unit = 'ether'): string {
  return convert.fromWei(value, unit);
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
  minimalInput: string | number | AnyBN,
  decimals: number,
  isRounding = true,
): string {
  const roundedInput = isRounding ? Number(minimalInput) : minimalInput;
  const prefixedInput = addHexPrefix(
    typeof roundedInput === 'string'
      ? roundedInput.toString()
      : roundedInput.toString(16),
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
  const fractionMatch = fraction.match(regex.fractions);
  fraction = fractionMatch ? fractionMatch[1] : fraction;
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
): string {
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
export function toTokenMinimalUnit(
  tokenValue: string | number | AnyBN,
  decimals: number,
): BN4 {
  const base = toBN(Math.pow(10, decimals).toString());
  let value = convert.numberToString(tokenValue);
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
  let wholePart = comps[0],
    fractionPart = comps[1];
  if (!wholePart) {
    wholePart = '0';
  }
  if (!fractionPart) {
    fractionPart = '';
  }
  if (fractionPart.length > decimals) {
    throw new Error(
      '[number] while converting number ' +
        tokenValue +
        ' to token minimal util, too many decimal places',
    );
  }
  while (fractionPart.length < decimals) {
    fractionPart += '0';
  }
  const whole = new BN4(wholePart);
  const fraction = new BN4(fractionPart);
  let tokenMinimal = whole.mul(base).add(fraction);
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
  tokenValue: string | number | AnyBN | null | undefined,
  decimals: number,
  decimalsToShow = 5,
): string {
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
): string {
  const addition = transferFiat + feeFiat;
  let renderMinimalUnit;
  if (addition < 0.00001 && addition > 0) {
    renderMinimalUnit = '< 0.00001';
  } else {
    const base = Math.pow(10, decimalsToShow);
    renderMinimalUnit = (Math.round(addition * base) / base).toString();
  }
  if (currencySymbols[currentCurrency]) {
    return `${currencySymbols[currentCurrency]}${renderMinimalUnit}`;
  }
  return `${renderMinimalUnit} ${currentCurrency}`;
}

/**
 * Limits a number to a max decimal places.
 *
 * @param num - The number to limit
 * @param maxDecimalPlaces - The maximum amount of decimal places
 * @returns the limited number
 */
export function limitToMaximumDecimalPlaces(
  num: number,
  maxDecimalPlaces = 5,
): string | number {
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
): BN4 {
  const floatFiatConverted =
    parseFloat(String(fiat)) / (conversionRate * exchangeRate);
  const base = Math.pow(10, decimals);
  const weiNumber = floatFiatConverted * base;
  // avoid decimals
  const weiString = weiNumber.toLocaleString('fullwide', {
    useGrouping: false,
  });
  const weiBN = safeNumberToBN(weiString);
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
  value: string | number | AnyBN | null | undefined,
  decimalsToShow = 5,
): string {
  let renderWeiValue = '0';
  // avoid undefined
  if (value) {
    const wei = fromWei(value);
    const weiNumber = parseFloat(wei);
    if (weiNumber < 0.00001 && weiNumber > 0) {
      renderWeiValue = '< 0.00001';
    } else {
      const base = Math.pow(10, decimalsToShow);
      renderWeiValue = (Math.round(weiNumber * base) / base).toString();
    }
  }
  return renderWeiValue;
}

/**
 * Converts token BN value to hex string number to be sent
 *
 * @param value - BN instance to convert
 * @param decimals - Decimals to be considered on the conversion
 * @returns String of the hex token value
 */
export function calcTokenValueToSend(
  value: AnyBN | undefined | null,
  decimals: number,
): string | number {
  return value
    ? ((value as unknown as number) * Math.pow(10, decimals)).toString(16)
    : 0;
}

/**
 * Checks if a value is a BN instance
 *
 * @param value - Value to check
 * @returns True if the value is a BN instance
 */
export function isBN(value: unknown): value is BN4 {
  return BN4.isBN(value);
}

/**
 * Determines if a string is a valid decimal
 *
 * @param value - String to check
 * @returns True if the string is a valid decimal
 */
export function isDecimal(value: number | string): boolean {
  return (
    Number.isFinite(parseFloat(String(value))) &&
    !Number.isNaN(parseFloat(String(value))) &&
    !isNaN(Number(value))
  );
}

/**
 * Creates a BN object from a string
 *
 * @param value - Some numeric value represented as a string
 * @returns BN instance
 */
export function toBN(value: string | number | BN4): BN4 {
  return new BN4(value);
}

/**
 * Determines if a string is a valid number
 *
 * @param str - Number string
 * @returns True if the string  is a valid number
 */
export function isNumber(str: string | null | undefined): boolean {
  return regex.number.test(str as string);
}

/**
 * Determines if a value is a number
 *
 * @param value - Value to check
 * @returns True if the value is a valid number
 */
export function isNumberValue(
  value: number | string | null | undefined,
): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === 'number') {
    return !Number.isNaN(value) && Number.isFinite(value);
  }

  return isDecimal(value);
}

export const dotAndCommaDecimalFormatter = (
  value: string | number,
): string => {
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

export const isNumberScientificNotationWhenString = (
  value: unknown,
): value is number => {
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
export function toWei(value: string | number | AnyBN, unit = 'ether'): BN4 {
  // check the posibilty to convert to BN
  // directly on the swaps screen
  const safeValue = isNumberScientificNotationWhenString(value)
    ? value.toFixed(18)
    : value;
  return convert.toWei(safeValue, unit);
}

/**
 * Converts some unit to Gwei
 *
 * @param value - Value to convert
 * @param unit - Unit to convert from, ether by default
 * @returns the value in Gwei
 */
export function toGwei(value: string | number | AnyBN, unit = 'ether'): number {
  return Number(fromWei(value, unit)) * 1000000000;
}

/**
 * Converts some unit to Gwei and return it in render format
 *
 * @param value - Value to convert
 * @param unit - Unit to convert from, ether by default
 * @returns the renderable number
 */
export function renderToGwei(
  value: string | number | AnyBN,
  unit = 'ether',
): number {
  const gwei = Number(fromWei(value, unit)) * 1000000000;
  const gweiRounded = parseFloat(String(Math.round(gwei)));
  return isNaN(gweiRounded) ? 0 : gweiRounded;
}

/**
 * Converts wei expressed as a BN instance into a human-readable fiat string
 * TODO: wei should be a BN instance, but we're not sure if it's always the case
 *
 * @param wei - BN corresponding to an amount of wei
 * @param conversionRate - ETH to current currency conversion rate
 * @param currencyCode - Current currency code to display
 * @param decimalsToShow - Decimals to show
 * @returns Currency-formatted string
 */
export function weiToFiat(
  wei: AnyBN | number | null | undefined,
  conversionRate: number | null,
  currencyCode: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  decimalsToShow = 5,
): string | undefined {
  if (!conversionRate) return undefined;
  if (!wei || !isBN(wei) || !conversionRate) {
    return addCurrencySymbol(0, currencyCode);
  }
  const decimals = (currencyCode === 'usd' && 2) || undefined;
  const value = weiToFiatNumber(wei, conversionRate, decimals);
  return addCurrencySymbol(value, currencyCode);
}

/**
 * Renders fiat amount with currency symbol if exists
 *
 * @param amount - Number corresponding to a currency amount
 * @param currencyCode - Current currency code to display
 * @param extendDecimals - Whether to extend the amount of decimals shown
 * @returns Currency-formatted string
 */
export function addCurrencySymbol(
  amount: number | string,
  currencyCode: string,
  extendDecimals = false,
): string {
  const prefix = parseFloat(String(amount)) < 0 ? '-' : '';
  let formattedAmount: number | string = amount;
  if (extendDecimals) {
    if (isNumberScientificNotationWhenString(formattedAmount)) {
      formattedAmount = formattedAmount.toFixed(18);
    }

    // if bigger than 0.01, show 2 decimals
    if (Number(formattedAmount) >= 0.01 || Number(formattedAmount) <= -0.01) {
      formattedAmount = parseFloat(String(formattedAmount)).toFixed(2);
    }

    // if less than 0.01, show all the decimals that are zero except the trailing zeros, and 3 decimals for the rest that are not zero
    if (
      (Number(formattedAmount) < 0.01 && Number(formattedAmount) > 0) ||
      (Number(formattedAmount) > -0.01 && Number(formattedAmount) < 0)
    ) {
      const decimalString = formattedAmount.toString().split('.')[1];
      if (decimalString && decimalString.length > 1) {
        const nonZeroDecimalMatch = decimalString.match(regex.decimalString);
        const firstNonZeroDecimal = nonZeroDecimalMatch
          ? decimalString.indexOf(nonZeroDecimalMatch[0])
          : -1;
        if (firstNonZeroDecimal > 0) {
          formattedAmount = parseFloat(String(formattedAmount)).toFixed(
            firstNonZeroDecimal + 3,
          );
          // remove trailing zeros
          formattedAmount = formattedAmount.replace(regex.trailingZero, '');
        }
      }
    }
  }

  if (currencyCode === 'usd' && !extendDecimals) {
    formattedAmount = parseFloat(String(formattedAmount)).toFixed(2);
  }

  const amountString = formattedAmount.toString();
  const absAmountStr = amountString.startsWith('-')
    ? amountString.slice(1) // Remove the first character if it's a '-'
    : amountString;

  if (currencySymbols[currencyCode]) {
    return `${prefix}${currencySymbols[currencyCode]}${absAmountStr}`;
  }

  const lowercaseCurrencyCode = currencyCode?.toLowerCase();

  if (currencySymbols[lowercaseCurrencyCode]) {
    return `${prefix}${currencySymbols[lowercaseCurrencyCode]}${absAmountStr}`;
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
  wei: string | number | AnyBN,
  conversionRate: number,
  decimalsToShow: number = 5,
): number {
  const base = Math.pow(10, decimalsToShow);
  const eth = fromWei(wei).toString();
  const value = parseFloat(
    String(Math.floor(Number(eth) * conversionRate * base) / base),
  );
  return isNaN(value) ? 0.0 : value;
}

/**
 * Handles wie input to have less or equal to 18 decimals
 *
 * @param wei - Amount in decimal notation
 * @returns Number string with less or equal 18 decimals
 */
export function handleWeiNumber(wei: string): string {
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
export function fiatNumberToWei(
  fiat: number | string,
  conversionRate: number,
): BN4 | string {
  const floatFiatConverted = parseFloat(String(fiat)) / conversionRate;
  if (
    !floatFiatConverted ||
    isNaN(floatFiatConverted) ||
    floatFiatConverted === Infinity
  ) {
    return '0x0';
  }
  const base = Math.pow(10, 18);
  const weiNumber = Math.trunc(base * floatFiatConverted);
  // avoid decimals
  const weiString = weiNumber.toLocaleString('fullwide', {
    useGrouping: false,
  });
  const weiBN = safeNumberToBN(weiString);
  return weiBN;
}

/**
 * Wraps 'numberToBN' method to avoid potential undefined and decimal values
 *
 * @param value - number
 * @returns The converted value as BN instance
 */
export function safeNumberToBN(value: string | number | AnyBN): BN4 {
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
 * @param value - number/string to be splitted
 * @param divider - string value to use to split the string (default '.')
 * @returns the selected splitted element
 */

export function fastSplit(value: string, divider = '.'): string {
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
  conversionRate: number | undefined | null,
  exchangeRate: number | undefined,
  currencyCode: string,
): string | undefined {
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
  exchangeRate: number,
  decimalsToShow = 5,
): number {
  const base = Math.pow(10, decimalsToShow);
  const fiatFixed = parseFloat(
    String(
      Math.floor(Number(balance) * conversionRate * exchangeRate * base) / base,
    ),
  );
  return isNaN(fiatFixed) ? 0.0 : fiatFixed;
}

export function getCurrencySymbol(currencyCode: string): string {
  if (currencySymbols[currencyCode]) {
    return `${currencySymbols[currencyCode]}`;
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
): string {
  const base = Math.pow(10, decimalsToShow);
  const rounded = parseFloat(String(Math.round(value * base) / base));
  const fiatFixed = isNaN(rounded) ? 0.0 : rounded;
  if (currencySymbols[currencyCode]) {
    return `${currencySymbols[currencyCode]}${fiatFixed}`;
  }
  return `${fiatFixed} ${currencyCode.toUpperCase()}`;
}

/**
 * Converts BN wei value to wei units in string format
 *
 * @param value - Object containing wei value in BN format
 * @returns Corresponding wei value
 */
export function renderWei(
  value: string | number | AnyBN | null | undefined,
): string {
  if (!value) return '0';
  const wei = fromWei(value);
  const renderWeiValue = Number(wei) * Math.pow(10, 18);
  return renderWeiValue.toString();
}
/**
 * Format a string number in an string number with at most 5 decimal places
 *
 * @param number - String containing a number
 * @returns String number with none or at most 5 decimal places
 */
export function renderNumber(number: string): string {
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
export function isPrefixedFormattedHexString(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false;
  }
  return regex.prefixedFormattedHexString.test(value);
}

/**
 * Options describing how a value should be converted.
 */
export interface ConverterInput {
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
}: ConverterInput): string | BN4 | BigNumber => {
  let convertedValue: BigNumber = fromNumericBase
    ? toBigNumber[fromNumericBase](value)
    : new BigNumber(value as BigNumber.Value);

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

export const conversionUtil = (
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
  }: Omit<ConverterInput, 'value'>,
): string | BN4 | BigNumber =>
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

export function toHexadecimal(decimal: Hex): Hex;
export function toHexadecimal(decimal: string | number): string;
export function toHexadecimal(
  decimal?: string | number | null,
): string | number | null | undefined;
export function toHexadecimal(
  decimal?: string | number | null,
): string | number | null | undefined {
  if (!decimal) return decimal;
  const decimalString = String(decimal);
  if (decimalString.startsWith('0x')) return decimalString;
  return toBigNumber.dec(decimalString).toString(16);
}

export const calculateEthFeeForMultiLayer = ({
  multiLayerL1FeeTotal,
  ethFee = 0,
}: {
  multiLayerL1FeeTotal?: string | null;
  ethFee?: string | number;
}): string | number => {
  if (!multiLayerL1FeeTotal) {
    return ethFee;
  }
  const multiLayerL1FeeTotalDecEth = conversionUtil(multiLayerL1FeeTotal, {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
    fromDenomination: 'WEI',
    toDenomination: 'ETH',
  });
  return new BigNumber(String(multiLayerL1FeeTotalDecEth))
    .plus(new BigNumber(ethFee ?? 0))
    .toString(10);
};

/**
 * Checks whether a value is zero
 *
 * @param value - Value to check
 * @returns true if value is zero
 */
export const isZeroValue = (value: unknown): boolean => {
  if (value === null || value === undefined) {
    return false;
  }
  return value === '0x0' || (isBN(value) && value.isZero()) || isZero(value);
};

export const formatValueToMatchTokenDecimals = (
  value: string | null | undefined,
  decimal: number | string | null | undefined,
): string | null | undefined => {
  if (value === null || value === undefined) {
    return value;
  }
  let formattedValue = value;
  const decimalIndex = formattedValue.indexOf('.');
  if (decimalIndex !== -1) {
    const fractionalLength = formattedValue.substring(decimalIndex + 1).length;
    if (fractionalLength > Number(decimal)) {
      formattedValue = parseFloat(formattedValue).toFixed(Number(decimal));
    }
  }
  return formattedValue;
};

export function safeBNToHex<ValueType extends AnyBN | null | undefined>(
  value: ValueType,
): ValueType extends AnyBN ? Hex : ValueType {
  type Result = ValueType extends AnyBN ? Hex : ValueType;

  if (value === null || value === undefined) {
    return value as Result;
  }

  return BNToHex(value) as Result;
}

/**
 * Formats a potentially large number to the nearest unit.
 * e.g. 1T for trillions, 2.3B for billions, 4.56M for millions, 7,890 for thousands, etc.
 *
 * @param i18n - An I18nContext translator.
 * @param number - The number to format.
 * @returns A localized string of the formatted number + unit.
 */
export const localizeLargeNumber = (
  i18n: { t: (key: string) => string },
  number: number,
): string => {
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

export const convertDecimalToPercentage = (decimal: number): string => {
  if (typeof decimal !== 'number' || isNaN(decimal)) {
    throw new Error('Input must be a valid number');
  }
  return (decimal * 100).toFixed(2) + '%';
};
