/**
 * Collection of utility functions for consistent formatting and conversion
 */
import { stripHexPrefix } from 'ethereumjs-util';
import BN4 from 'bnjs4';
import { utils as ethersUtils } from 'ethers';
import convert from '@metamask/ethjs-unit';
import { add0x, remove0x } from '@metamask/utils';
import numberToBN from 'number-to-bn';
import BigNumber from 'bignumber.js';

import currencySymbols from '../currency-symbols.json';
import { isZero } from '../lodash';
import { regex } from '../regex';

type BNLike = BN4 | { toString(radix?: number): string };
export type NumericValue = number | string | BNLike;

const MAX_DECIMALS_FOR_TOKENS = 36;
BigNumber.config({ DECIMAL_PLACES: MAX_DECIMALS_FOR_TOKENS });

// Big Number Constants
const BIG_NUMBER_WEI_MULTIPLIER = new BigNumber('1000000000000000000');
const BIG_NUMBER_GWEI_MULTIPLIER = new BigNumber('1000000000');
const BIG_NUMBER_ETH_MULTIPLIER = new BigNumber('1');

/**
 * Converts a hex string to a BN object.
 * Adapt function with non string argument handler
 *
 * @param inputHex - Number represented as a hex string.
 * @returns A BN instance.
 */
export const hexToBN = (
  inputHex: string | number | BN4 | null | undefined,
): BN4 => {
  if (inputHex === null || inputHex === undefined) {
    return new BN4(0);
  }
  if (typeof inputHex !== 'string') {
    return new BN4(inputHex as number, 16);
  }
  return inputHex ? new BN4(remove0x(inputHex), 16) : new BN4(0);
};

/**
 * Converts a BN object to a hex string with a '0x' prefix.
 *
 * @param inputBn - BN instance to convert to a hex string.
 * @returns A '0x'-prefixed hex string.
 */
// TODO: Either fix this lint violation or explain why it's necessary to ignore.
// eslint-disable-next-line @typescript-eslint/naming-convention
export function BNToHex(
  inputBn: BN4 | { toString(radix?: number): string },
): `0x${string}` {
  return add0x(inputBn.toString(16)) as `0x${string}`;
}

// Setter Maps
export const toBigNumber = {
  hex: (n: string): BigNumber => new BigNumber(stripHexPrefix(n), 16),
  dec: (n: string | number | BigNumber): BigNumber =>
    new BigNumber(String(n), 10),
  BN: (n: BNLike): BigNumber => new BigNumber(n.toString(16), 16),
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
  dec: (n: BigNumber | string | number): string =>
    new BigNumber(n as string).toString(10),
  BN: (n: BigNumber): BN4 => new BN4(n.toString(16)),
};

/**
 * Prefixes a hex string with '0x' or '-0x' and returns it. Idempotent.
 *
 * @param str - The string to prefix.
 * @returns The prefixed string.
 */
export const addHexPrefix = (str: unknown): string => {
  if (typeof str !== 'string' || str.match(regex.hexPrefix)) {
    return str as string;
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
export function fromWei(
  value: NumericValue = 0,
  unit: string = 'ether',
): string {
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
  minimalInput: NumericValue,
  decimals: number,
  isRounding: boolean = true,
): string {
  const minimalRounded: number | NumericValue = isRounding
    ? Number(minimalInput)
    : minimalInput;
  const prefixedInput = addHexPrefix(
    (minimalRounded as number | string).toString(16),
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
  const matched = fraction.match(regex.fractions);
  fraction = matched ? matched[1] : fraction;
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
  tokenValue: NumericValue,
  decimals: number,
): BN4 {
  const base = toBN(Math.pow(10, decimals).toString());
  let value: string = convert.numberToString(tokenValue);
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
  let whole: string = comps[0];
  let fraction: string = comps[1];
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
  tokenValue: NumericValue,
  decimals: number,
  decimalsToShow: number = 5,
): string {
  const minimalUnit = fromTokenMinimalUnit(tokenValue || 0, decimals);
  const minimalUnitNumber = parseFloat(minimalUnit);
  let renderMinimalUnit: string;
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
  decimalsToShow: number = 5,
): string {
  const addition = transferFiat + feeFiat;
  let renderMinimalUnit: string;
  if (addition < 0.00001 && addition > 0) {
    renderMinimalUnit = '< 0.00001';
  } else {
    const base = Math.pow(10, decimalsToShow);
    renderMinimalUnit = (Math.round(addition * base) / base).toString();
  }
  const symbols = currencySymbols as Record<string, string>;
  if (symbols[currentCurrency]) {
    return `${symbols[currentCurrency]}${renderMinimalUnit}`;
  }
  return `${renderMinimalUnit} ${currentCurrency}`;
}

/**
 * Limits a number to a max decimal places.
 */
export function limitToMaximumDecimalPlaces(
  num: number,
  maxDecimalPlaces: number = 5,
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
    parseFloat(fiat as string) / (conversionRate * exchangeRate);
  const base = Math.pow(10, decimals);
  let weiNumber: number | string = floatFiatConverted * base;
  // avoid decimals
  weiNumber = weiNumber.toLocaleString('fullwide', { useGrouping: false });
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
  decimalsToShow: number = 5,
): string {
  let renderWei = '0';
  // avoid undefined
  if (value) {
    const wei = fromWei(value);
    const weiNumber = parseFloat(wei);
    if (weiNumber < 0.00001 && weiNumber > 0) {
      renderWei = '< 0.00001';
    } else {
      const base = Math.pow(10, decimalsToShow);
      renderWei = (Math.round(weiNumber * base) / base).toString();
    }
  }
  return renderWei;
}

/**
 * Converts token BN value to hex string number to be sent
 *
 * @param value - BN instance to convert
 * @param decimals - Decimals to be considered on the conversion
 * @returns String of the hex token value
 */
export function calcTokenValueToSend(
  value: NumericValue,
  decimals: number,
): string | 0 {
  return value
    ? ((value as unknown as number) * Math.pow(10, decimals)).toString(16)
    : 0;
}

/**
 * Checks if a value is a BN instance
 */
export function isBN(value: unknown): boolean {
  return BN4.isBN(value);
}

/**
 * Determines if a string is a valid decimal
 */
export function isDecimal(value: number | string): boolean {
  return (
    Number.isFinite(parseFloat(value as string)) &&
    !Number.isNaN(parseFloat(value as string)) &&
    !isNaN(+value)
  );
}

/**
 * Creates a BN object from a string
 */
export function toBN(value: number | string | BN4): BN4 {
  return new BN4(value as string);
}

/**
 * Determines if a string is a valid number
 */
export function isNumber(str: unknown): boolean {
  if (typeof str !== 'string') {
    return false;
  }
  return regex.number.test(str);
}

/**
 * Determines if a value is a number
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

export const dotAndCommaDecimalFormatter = (value: string | number): string => {
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

export const isNumberScientificNotationWhenString = (value: unknown): boolean => {
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
export function toWei(value: NumericValue, unit: string = 'ether'): BN4 {
  // check the posibilty to convert to BN
  // directly on the swaps screen
  let normalized: NumericValue = value;
  if (isNumberScientificNotationWhenString(value)) {
    normalized = (value as number).toFixed(18);
  }
  return convert.toWei(normalized, unit);
}

/**
 * Converts some unit to Gwei
 */
export function toGwei(value: NumericValue, unit: string = 'ether'): number {
  return (fromWei(value, unit) as unknown as number) * 1000000000;
}

/**
 * Converts some unit to Gwei and return it in render format
 */
export function renderToGwei(
  value: NumericValue,
  unit: string = 'ether',
): number {
  const gwei = (fromWei(value, unit) as unknown as number) * 1000000000;
  let gweiFixed: number = parseFloat(String(Math.round(gwei)));
  gweiFixed = isNaN(gweiFixed) ? 0 : gweiFixed;
  return gweiFixed;
}

/**
 * Converts wei expressed as a BN instance into a human-readable fiat string
 * TODO: wei should be a BN instance, but we're not sure if it's always the case
 *
 * @param wei - BN corresponding to an amount of wei
 * @param conversionRate - ETH to current currency conversion rate
 * @param currencyCode - Current currency code to display
 * @returns Currency-formatted string
 */
export function weiToFiat(
  wei: BN4 | number | null | undefined,
  conversionRate: number | null = null,
  currencyCode: string,
  decimalsToShow: number = 5,
): string {
  if (!conversionRate) return '';
  if (!wei || !isBN(wei) || !conversionRate) {
    return addCurrencySymbol(0, currencyCode);
  }
  const localDecimals: number | undefined =
    (currencyCode === 'usd' && 2) || undefined;
  const value = weiToFiatNumber(wei as BN4, conversionRate, localDecimals);
  return addCurrencySymbol(value, currencyCode);
}

/**
 * Renders fiat amount with currency symbol if exists
 *
 * @param amount - Number corresponding to a currency amount
 * @param currencyCode - Current currency code to display
 * @returns Currency-formatted string
 */
export function addCurrencySymbol(
  amount: number | string,
  currencyCode: string,
  extendDecimals: boolean = false,
): string {
  const prefix = parseFloat(amount as string) < 0 ? '-' : '';
  let normalized: number | string = amount;
  if (extendDecimals) {
    if (isNumberScientificNotationWhenString(normalized)) {
      normalized = (normalized as number).toFixed(18);
    }

    // if bigger than 0.01, show 2 decimals
    if (
      (normalized as number) >= 0.01 ||
      (normalized as number) <= -0.01
    ) {
      normalized = parseFloat(normalized as string).toFixed(2);
    }

    // if less than 0.01, show all the decimals that are zero except the trailing zeros, and 3 decimals for the rest that are not zero
    if (
      ((normalized as number) < 0.01 && (normalized as number) > 0) ||
      ((normalized as number) > -0.01 && (normalized as number) < 0)
    ) {
      const decimalString = normalized.toString().split('.')[1];
      if (decimalString && decimalString.length > 1) {
        const matched = decimalString.match(regex.decimalString);
        const firstNonZeroDecimal = matched
          ? decimalString.indexOf(matched[0])
          : -1;
        if (firstNonZeroDecimal > 0) {
          normalized = parseFloat(normalized as string).toFixed(
            firstNonZeroDecimal + 3,
          );
          // remove trailing zeros
          normalized = (normalized as string).replace(regex.trailingZero, '');
        }
      }
    }
  }

  if (currencyCode === 'usd' && !extendDecimals) {
    normalized = parseFloat(normalized as string).toFixed(2);
  }

  const amountString = normalized.toString();
  const absAmountStr = amountString.startsWith('-')
    ? amountString.slice(1) // Remove the first character if it's a '-'
    : amountString;

  const symbols = currencySymbols as Record<string, string | undefined>;

  if (symbols[currencyCode]) {
    return `${prefix}${symbols[currencyCode]}${absAmountStr}`;
  }

  const lowercaseCurrencyCode = currencyCode?.toLowerCase();

  if (symbols[lowercaseCurrencyCode]) {
    return `${prefix}${symbols[lowercaseCurrencyCode]}${absAmountStr}`;
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
  wei: BN4 | number | string,
  conversionRate: number,
  decimalsToShow: number = 5,
): number {
  const base = Math.pow(10, decimalsToShow);
  const eth = fromWei(wei).toString();
  let value = parseFloat(
    String(Math.floor(Number(eth) * conversionRate * base) / base),
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
export function handleWeiNumber(wei: string): string {
  const comps = wei.split('.');
  let fraction: string | undefined = comps[1];
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
  const floatFiatConverted = parseFloat(fiat as string) / conversionRate;
  if (
    !floatFiatConverted ||
    isNaN(floatFiatConverted) ||
    floatFiatConverted === Infinity
  ) {
    return '0x0';
  }
  const base = Math.pow(10, 18);
  let weiNumber: number | string = Math.trunc(base * floatFiatConverted);
  // avoid decimals
  weiNumber = weiNumber.toLocaleString('fullwide', { useGrouping: false });
  const weiBN = safeNumberToBN(weiNumber);
  return weiBN;
}

/**
 * Wraps 'numberToBN' method to avoid potential undefined and decimal values
 *
 * @param value - number
 * @returns The converted value as BN instance
 */
export function safeNumberToBN(value: number | string | null | undefined): BN4 {
  try {
    const safeValue = fastSplit(value?.toString() ?? '') || '0';
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
export function fastSplit(value: string, divider: string = '.'): string {
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
  balance: number | string | null | undefined,
  conversionRate: number | null | undefined,
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
  decimalsToShow: number = 5,
): number {
  const base = Math.pow(10, decimalsToShow);
  let fiatFixed = parseFloat(
    String(
      Math.floor(
        Number(balance) * conversionRate * exchangeRate * base,
      ) / base,
    ),
  );
  fiatFixed = isNaN(fiatFixed) ? 0.0 : fiatFixed;
  return fiatFixed;
}

export function getCurrencySymbol(currencyCode: string): string {
  const symbols = currencySymbols as Record<string, string | undefined>;
  if (symbols[currencyCode]) {
    return `${symbols[currencyCode]}`;
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
  decimalsToShow: number = 5,
): string {
  const base = Math.pow(10, decimalsToShow);
  let fiatFixed = parseFloat(String(Math.round(value * base) / base));
  fiatFixed = isNaN(fiatFixed) ? 0.0 : fiatFixed;
  const symbols = currencySymbols as Record<string, string | undefined>;
  if (symbols[currencyCode]) {
    return `${symbols[currencyCode]}${fiatFixed}`;
  }
  return `${fiatFixed} ${currencyCode.toUpperCase()}`;
}

/**
 * Converts BN wei value to wei units in string format
 *
 * @param value - Object containing wei value in BN format
 * @returns Corresponding wei value
 */
export function renderWei(value: NumericValue | null | undefined): string {
  if (!value) return '0';
  const wei = fromWei(value);
  const renderWeiVal = (wei as unknown as number) * Math.pow(10, 18);
  return renderWeiVal.toString();
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
 * @returns True if the value is a correctly formatted hex string, false otherwise.
 */
export function isPrefixedFormattedHexString(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false;
  }
  return regex.prefixedFormattedHexString.test(value);
}

export type NumericBase = 'hex' | 'dec' | 'BN';
export type EthDenomination = 'WEI' | 'GWEI' | 'ETH';

export interface ConverterArgs {
  value: NumericValue;
  fromNumericBase?: NumericBase;
  fromDenomination?: EthDenomination;
  fromCurrency?: string | null;
  toNumericBase?: NumericBase;
  toDenomination?: EthDenomination;
  toCurrency?: string | null;
  numberOfDecimals?: number;
  // Accept BigNumber-shaped objects (anything with `.toString()`) in addition
  // to the basic numeric and string forms.
  conversionRate?: number | string | { toString(): string } | null;
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
}: ConverterArgs): string | BigNumber | BN4 => {
  let convertedValue: BigNumber | string | BN4 = fromNumericBase
    ? toBigNumber[fromNumericBase](value as never)
    : (value as BigNumber);

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
    const normalizedRate =
      typeof conversionRate === 'number' || typeof conversionRate === 'string'
        ? conversionRate
        : conversionRate.toString();
    let rate = toBigNumber.dec(normalizedRate);
    if (invertConversionRate) {
      rate = new BigNumber(1.0).div(normalizedRate);
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
  return convertedValue;
};

export interface ConversionUtilOptions {
  fromCurrency?: string | null;
  toCurrency?: string | null;
  fromNumericBase?: NumericBase;
  toNumericBase?: NumericBase;
  fromDenomination?: EthDenomination;
  toDenomination?: EthDenomination;
  numberOfDecimals?: number;
  // Accept BigNumber-shaped objects (anything with `.toString()`) in addition
  // to the basic numeric and string forms.
  conversionRate?: number | string | { toString(): string } | null;
  invertConversionRate?: boolean;
  roundDown?: number;
}

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
  }: ConversionUtilOptions,
): string | BigNumber | BN4 =>
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

export const toHexadecimal = (
  decimal?: number | string,
): `0x${string}` => {
  if (!decimal) return decimal as `0x${string}`;
  let decimalString: string;
  if (typeof decimal !== 'string') {
    decimalString = String(decimal);
  } else {
    decimalString = decimal;
  }
  if (decimalString.startsWith('0x')) return decimalString as `0x${string}`;
  return toBigNumber.dec(decimalString).toString(16) as `0x${string}`;
};

export const calculateEthFeeForMultiLayer = ({
  multiLayerL1FeeTotal,
  ethFee = 0,
}: {
  multiLayerL1FeeTotal?: string | null;
  ethFee?: number | string;
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
  return new BigNumber(multiLayerL1FeeTotalDecEth as string)
    .plus(new BigNumber(ethFee ?? 0))
    .toString(10);
};

/**
 *
 * @param value - Value to check
 * @returns true if value is zero
 */
export const isZeroValue = (value: unknown): boolean => {
  if (value === null || value === undefined) {
    return false;
  }
  return (
    value === '0x0' ||
    (isBN(value) && (value as BN4).isZero()) ||
    isZero(value as number | string)
  );
};

export const formatValueToMatchTokenDecimals = (
  value: string | null | undefined,
  decimal: number | string | null | undefined,
): string | null | undefined => {
  if (value === null || value === undefined) {
    return value;
  }
  let normalized: string = value;
  const decimalIndex = normalized.indexOf('.');
  if (decimalIndex !== -1 && typeof decimal === 'number') {
    const fractionalLength = normalized.substring(decimalIndex + 1).length;
    if (fractionalLength > decimal) {
      normalized = parseFloat(normalized).toFixed(decimal);
    }
  }
  return normalized;
};

export const safeBNToHex = (
  value: BN4 | null | undefined,
): string | undefined => {
  if (value === null || value === undefined) {
    return undefined;
  }

  return BNToHex(value);
};

interface I18nLike {
  t: (key: string) => string;
}

type I18nLikeInput = { t: unknown };

/**
 * Formats a potentially large number to the nearest unit.
 * e.g. 1T for trillions, 2.3B for billions, 4.56M for millions, 7,890 for thousands, etc.
 *
 * @param i18n - An I18nContext translator.
 * @param number - The number to format.
 * @returns A localized string of the formatted number + unit.
 */
export const localizeLargeNumber = (
  i18n: I18nLikeInput,
  number: number,
): string => {
  const translator = (i18n as I18nLike).t;
  const oneTrillion = 1000000000000;
  const oneBillion = 1000000000;
  const oneMillion = 1000000;

  if (number >= oneTrillion) {
    return `${(number / oneTrillion).toFixed(2)}${translator(
      'token.trillion_abbreviation',
    )}`;
  } else if (number >= oneBillion) {
    return `${(number / oneBillion).toFixed(2)}${translator(
      'token.billion_abbreviation',
    )}`;
  } else if (number >= oneMillion) {
    return `${(number / oneMillion).toFixed(2)}${translator(
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
