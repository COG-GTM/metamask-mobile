/**
 * Collection of utility functions for consistent formatting and conversion
 */
import { stripHexPrefix } from 'ethereumjs-util';
import BN4 from 'bnjs4';
import BN5 from 'bnjs5';
import type BN from 'bn.js';
import { utils as ethersUtils } from 'ethers';
import convert from '@metamask/ethjs-unit';
import { add0x, remove0x } from '@metamask/utils';
import numberToBN from 'number-to-bn';
import BigNumber from 'bignumber.js';

import currencySymbols from '../currency-symbols.json';
import { isZero } from '../lodash';
import { regex } from '../regex';

// `bn.js`, `bnjs4`, and `bnjs5` are all aliases of the same underlying package
// at different major versions. Their TypeScript types are nominally distinct
// even though their runtime shape is identical, so accept any of them
// wherever a BN-like value is expected.
type AnyBN = BN4 | BN5 | BN;
type WeiInput = number | string | AnyBN | BigNumber;
type CurrencySymbolMap = Record<string, string | undefined>;

const symbols: CurrencySymbolMap = currencySymbols as CurrencySymbolMap;

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
  inputHex: string | number | AnyBN | null | undefined,
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
export function BNToHex(inputBn: AnyBN): `0x${string}` {
  return add0x(inputBn.toString(16));
}

type NumericBaseKey = 'hex' | 'dec' | 'BN';
type EthDenominationKey = 'WEI' | 'GWEI' | 'ETH';

// Setter Maps
export const toBigNumber: Record<
  NumericBaseKey,
  (n: number | string | BigNumber | AnyBN | null | undefined) => BigNumber
> = {
  hex: (n) => new BigNumber(stripHexPrefix(String(n)), 16),
  dec: (n) => new BigNumber(String(n), 10),
  BN: (n) => new BigNumber((n as AnyBN).toString(16), 16),
};
const toNormalizedDenomination: Record<
  EthDenominationKey,
  (bigNumber: BigNumber) => BigNumber
> = {
  WEI: (bigNumber) => bigNumber.div(BIG_NUMBER_WEI_MULTIPLIER),
  GWEI: (bigNumber) => bigNumber.div(BIG_NUMBER_GWEI_MULTIPLIER),
  ETH: (bigNumber) => bigNumber.div(BIG_NUMBER_ETH_MULTIPLIER),
};
const toSpecifiedDenomination: Record<
  EthDenominationKey,
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

/**
 * Prefixes a hex string with '0x' or '-0x' and returns it. Idempotent.
 * Non-string inputs are returned unchanged (preserving the original
 * JavaScript runtime behavior).
 *
 * @param str - The string to prefix.
 * @returns The prefixed string.
 */
export function addHexPrefix(str: string): string;
export function addHexPrefix<T>(str: T): T extends string ? string : T;
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
export function fromWei(value: WeiInput = 0, unit: string = 'ether'): string {
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
  minimalInput: number | string | AnyBN,
  decimals: number,
  isRounding: boolean = true,
): string {
  const inputAsNumberOrPassthrough: number | string | AnyBN = isRounding
    ? Number(minimalInput)
    : minimalInput;
  const prefixedInput = addHexPrefix(
    inputAsNumberOrPassthrough.toString(16 as unknown as number),
  ) as string;
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
  tokenValue: number | string | AnyBN,
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
        String(tokenValue) +
        ' to token minimal util, invalid value',
    );
  }
  // Split it into a whole and fractional part
  const comps = value.split('.');
  if (comps.length > 2) {
    throw new Error(
      '[number] while converting number ' +
        String(tokenValue) +
        ' to token minimal util,  too many decimal points',
    );
  }
  let wholeStr = comps[0];
  let fractionStr = comps[1];
  if (!wholeStr) {
    wholeStr = '0';
  }
  if (!fractionStr) {
    fractionStr = '';
  }
  if (fractionStr.length > decimals) {
    throw new Error(
      '[number] while converting number ' +
        String(tokenValue) +
        ' to token minimal util, too many decimal places',
    );
  }
  while (fractionStr.length < decimals) {
    fractionStr += '0';
  }
  const whole = new BN4(wholeStr);
  const fraction = new BN4(fractionStr);
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
 * @param decimalsToShow - Decimals to show (defaults to 5)
 * @returns Number of token minimal unit, in render format
 * If value is less than 5 precision decimals will show '< 0.00001'
 */
export function renderFromTokenMinimalUnit(
  tokenValue: number | string | AnyBN,
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
  conversionRate: number | null | undefined,
  exchangeRate: number | null | undefined,
  decimals: number,
): BN4 {
  const floatFiatConverted =
    parseFloat(String(fiat)) /
    (Number(conversionRate) * Number(exchangeRate));
  const base = Math.pow(10, decimals);
  let weiNumber: number | string = floatFiatConverted * base;
  // avoid decimals
  weiNumber = (weiNumber as number).toLocaleString('fullwide', {
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
  value: WeiInput | undefined | null,
  decimalsToShow: number = 5,
): string {
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
 * @param value - BN instance (or numeric) to convert
 * @param decimals - Decimals to be considered on the conversion
 * @returns String of the hex token value
 */
export function calcTokenValueToSend(
  value: number | AnyBN | undefined | null,
  decimals: number,
): string | 0 {
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
    !isNaN(+value)
  );
}

/**
 * Creates a BN object from a string
 *
 * @param value - Some numeric value represented as a string
 * @returns BN instance
 */
export function toBN(value: number | string | AnyBN): BN4 {
  return new BN4(value as number);
}

/**
 * Determines if a string is a valid number
 *
 * @param str - Number string
 * @returns True if the string is a valid number
 */
export function isNumber(str: string | null | undefined): boolean {
  if (typeof str !== 'string') return false;
  return regex.number.test(str);
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
  value: number | string,
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
): boolean => {
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
export function toWei(value: WeiInput, unit: string = 'ether'): BN4 {
  // check the posibilty to convert to BN
  // directly on the swaps screen
  let working = value;
  if (isNumberScientificNotationWhenString(working)) {
    working = (working as number).toFixed(18);
  }
  return convert.toWei(working, unit);
}

/**
 * Converts some unit to Gwei
 *
 * @param value - Value to convert
 * @param unit - Unit to convert from, ether by default
 * @returns Numeric Gwei amount
 */
export function toGwei(value: WeiInput, unit: string = 'ether'): number {
  return Number(fromWei(value, unit)) * 1000000000;
}

/**
 * Converts some unit to Gwei and return it in render format
 *
 * @param value - Value to convert
 * @param unit - Unit to convert from, ether by default
 * @returns String instance containing the renderable number
 */
export function renderToGwei(value: WeiInput, unit: string = 'ether'): number {
  const gwei = Number(fromWei(value, unit)) * 1000000000;
  let gweiFixed = parseFloat(String(Math.round(gwei)));
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
  wei: AnyBN | number | string | null | undefined,
  conversionRate: number | null | undefined,
  currencyCode: string,
  decimalsToShow: number | undefined = 5,
): string {
  if (!wei || !isBN(wei) || !conversionRate) {
    return addCurrencySymbol(0, currencyCode);
  }
  const adjustedDecimals = currencyCode === 'usd' ? 2 : decimalsToShow;
  const value = weiToFiatNumber(wei, conversionRate, adjustedDecimals);
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
  let workingAmount: number | string = amount;
  const prefix = parseFloat(String(workingAmount)) < 0 ? '-' : '';
  if (extendDecimals) {
    if (isNumberScientificNotationWhenString(workingAmount)) {
      workingAmount = (workingAmount as number).toFixed(18);
    }

    // if bigger than 0.01, show 2 decimals
    if (
      Number(workingAmount) >= 0.01 ||
      Number(workingAmount) <= -0.01
    ) {
      workingAmount = parseFloat(String(workingAmount)).toFixed(2);
    }

    // if less than 0.01, show all the decimals that are zero except the trailing zeros, and 3 decimals for the rest that are not zero
    if (
      (Number(workingAmount) < 0.01 && Number(workingAmount) > 0) ||
      (Number(workingAmount) > -0.01 && Number(workingAmount) < 0)
    ) {
      const decimalString = String(workingAmount).split('.')[1];
      if (decimalString && decimalString.length > 1) {
        const match = decimalString.match(regex.decimalString);
        if (match) {
          const firstNonZeroDecimal = decimalString.indexOf(match[0]);
          if (firstNonZeroDecimal > 0) {
            workingAmount = parseFloat(String(workingAmount)).toFixed(
              firstNonZeroDecimal + 3,
            );
            // remove trailing zeros
            workingAmount = (workingAmount as string).replace(
              regex.trailingZero,
              '',
            );
          }
        }
      }
    }
  }

  if (currencyCode === 'usd' && !extendDecimals) {
    workingAmount = parseFloat(String(workingAmount)).toFixed(2);
  }

  const amountString = String(workingAmount);
  const absAmountStr = amountString.startsWith('-')
    ? amountString.slice(1) // Remove the first character if it's a '-'
    : amountString;

  if (symbols[currencyCode]) {
    return `${prefix}${symbols[currencyCode]}${absAmountStr}`;
  }

  const lowercaseCurrencyCode = currencyCode?.toLowerCase();

  if (lowercaseCurrencyCode && symbols[lowercaseCurrencyCode]) {
    return `${prefix}${symbols[lowercaseCurrencyCode]}${absAmountStr}`;
  }

  return `${prefix}${absAmountStr} ${currencyCode}`;
}

/**
 * Converts wei expressed as a BN instance into a human-readable fiat number
 *
 * @param wei - BN corresponding to an amount of wei
 * @param conversionRate - ETH to current currency conversion rate
 * @param decimalsToShow - Decimals to 5
 * @returns The converted balance
 */
export function weiToFiatNumber(
  wei: AnyBN | number | string,
  conversionRate: number | null | undefined,
  decimalsToShow: number = 5,
): number {
  const base = Math.pow(10, decimalsToShow);
  const eth = fromWei(wei).toString();
  let value = parseFloat(
    String(Math.floor(Number(eth) * Number(conversionRate) * base) / base),
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
 * @returns The converted balance as BN instance, or '0x0' string if invalid
 */
export function fiatNumberToWei(
  fiat: number | string,
  conversionRate: number | null | undefined,
): BN4 | string {
  const floatFiatConverted =
    parseFloat(String(fiat)) / Number(conversionRate);
  if (
    !floatFiatConverted ||
    isNaN(floatFiatConverted) ||
    floatFiatConverted === Infinity
  ) {
    return '0x0';
  }
  const base = Math.pow(10, 18);
  const weiNumberRaw = Math.trunc(base * floatFiatConverted);
  // avoid decimals
  const weiNumber = weiNumberRaw.toLocaleString('fullwide', {
    useGrouping: false,
  });
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
 * @returns The selected splitted element
 */

export function fastSplit(
  value: number | string,
  divider: string = '.',
): string {
  const valueStr = String(value);
  const [from, to] = [valueStr.indexOf(divider), 0];
  return valueStr.substring(from, to) || valueStr;
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
  exchangeRate: number | null | undefined,
  currencyCode: string,
): string | undefined {
  if (
    balance === undefined ||
    balance === null ||
    exchangeRate === undefined ||
    exchangeRate === null ||
    conversionRate === undefined ||
    conversionRate === null ||
    exchangeRate === 0
  ) {
    return undefined;
  }
  const fiatFixed = balanceToFiatNumber(balance, conversionRate, exchangeRate);
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
  conversionRate: number | null | undefined,
  exchangeRate: number | null | undefined,
  decimalsToShow: number = 5,
): number {
  const base = Math.pow(10, decimalsToShow);
  let fiatFixed = parseFloat(
    String(
      Math.floor(
        Number(balance) *
          Number(conversionRate) *
          Number(exchangeRate) *
          base,
      ) / base,
    ),
  );
  fiatFixed = isNaN(fiatFixed) ? 0.0 : fiatFixed;
  return fiatFixed;
}

export function getCurrencySymbol(currencyCode: string): string {
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
export function renderWei(value: AnyBN | number | string | undefined): string {
  if (!value) return '0';
  const wei = fromWei(value);
  const renderedWei = Number(wei) * Math.pow(10, 18);
  return renderedWei.toString();
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

interface ConverterOptions {
  value: number | string | BigNumber | AnyBN;
  fromNumericBase?: NumericBaseKey;
  fromDenomination?: EthDenominationKey;
  fromCurrency?: string | null;
  toNumericBase?: NumericBaseKey;
  toDenomination?: EthDenominationKey;
  toCurrency?: string | null;
  numberOfDecimals?: number;
  conversionRate?: number | string | null;
  invertConversionRate?: boolean;
  roundDown?: number;
}

type ConverterResult = BigNumber | string | BN4;

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
// (which is the most common usage) and otherwise returns a `BigNumber`.
// Overloads are provided so callers receive the narrowest type possible.
export function conversionUtil(
  value: number | string | BigNumber | AnyBN | null | undefined,
  options: ConversionUtilOptions & { toNumericBase: 'hex' | 'dec' },
): string;
export function conversionUtil(
  value: number | string | BigNumber | AnyBN | null | undefined,
  options: ConversionUtilOptions & { toNumericBase: 'BN' },
): BN4;
export function conversionUtil(
  value: number | string | BigNumber | AnyBN | null | undefined,
  options: ConversionUtilOptions,
): ConverterResult;
export function conversionUtil(
  value: number | string | BigNumber | AnyBN | null | undefined,
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
): ConverterResult {
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

export function toHexadecimal<T extends `0x${string}`>(decimal: T): T;
export function toHexadecimal(decimal: number | string): `0x${string}`;
export function toHexadecimal(decimal: undefined): undefined;
export function toHexadecimal(decimal: null): null;
export function toHexadecimal(
  decimal?: number | string | null,
): `0x${string}` | undefined | null;
export function toHexadecimal(
  decimal?: number | string | null,
): `0x${string}` | undefined | null {
  if (decimal === undefined || decimal === null) return decimal;
  const working: string =
    typeof decimal === 'string' ? decimal : String(decimal);
  if (working.startsWith('0x')) return working as `0x${string}`;
  return toBigNumber.dec(working).toString(16) as `0x${string}`;
}

interface CalculateEthFeeForMultiLayerInput {
  multiLayerL1FeeTotal?: string | null;
  ethFee?: number | string | null;
}

export const calculateEthFeeForMultiLayer = ({
  multiLayerL1FeeTotal,
  ethFee = 0,
}: CalculateEthFeeForMultiLayerInput): number | string => {
  if (!multiLayerL1FeeTotal) {
    return ethFee ?? 0;
  }
  const multiLayerL1FeeTotalDecEth = conversionUtil(multiLayerL1FeeTotal, {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
    fromDenomination: 'WEI',
    toDenomination: 'ETH',
  });
  return new BigNumber(multiLayerL1FeeTotalDecEth as string)
    .plus(new BigNumber(String(ethFee ?? 0)))
    .toString(10);
};

/**
 *
 * @param value - Value to check
 * @returns true if value is zero
 */
export const isZeroValue = (
  value: number | string | AnyBN | null | undefined,
): boolean => {
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
  let working: string = value;
  const decimalIndex = working.indexOf('.');
  if (decimalIndex !== -1) {
    const fractionalLength = working.substring(decimalIndex + 1).length;
    // The relational compare against `null`/`undefined`/non-numeric strings is
    // intentional to preserve the original JavaScript behavior. JS coerces the
    // right-hand side to a number for `>`, which yields `NaN` (=> always
    // false) for non-numeric strings/undefined and `0` for null.
    if (fractionalLength > (decimal as unknown as number)) {
      working = parseFloat(working).toFixed(decimal as unknown as number);
    }
  }
  return working;
};

export function safeBNToHex<T extends null | undefined>(value: T): T;
export function safeBNToHex(value: AnyBN): string;
export function safeBNToHex(
  value: AnyBN | null | undefined,
): string | null | undefined {
  if (value === null || value === undefined) {
    return value;
  }
  return BNToHex(value);
}

interface I18nLikeContext {
  // The translate function. Typed as `unknown` because callers (incl. jest
  // mocks) frequently pass a mock that isn't typed as a callable. The
  // function asserts it before invoking.
  t: unknown;
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
  i18n: I18nLikeContext,
  number: number,
): string => {
  const oneTrillion = 1000000000000;
  const oneBillion = 1000000000;
  const oneMillion = 1000000;
  const t = i18n.t as (key: string) => string;

  if (number >= oneTrillion) {
    return `${(number / oneTrillion).toFixed(2)}${t(
      'token.trillion_abbreviation',
    )}`;
  } else if (number >= oneBillion) {
    return `${(number / oneBillion).toFixed(2)}${t(
      'token.billion_abbreviation',
    )}`;
  } else if (number >= oneMillion) {
    return `${(number / oneMillion).toFixed(2)}${t(
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
