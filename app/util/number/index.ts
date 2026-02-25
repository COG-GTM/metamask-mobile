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
export const hexToBN = (inputHex: string | number | BN4): BN4 =>
  typeof inputHex !== 'string'
    ? new BN4(inputHex, 16)
    : (inputHex ? new BN4(remove0x(inputHex), 16) : new BN4(0));

/**
 * Converts a BN object to a hex string with a '0x' prefix.
 *
 * @param inputBn - BN instance to convert to a hex string.
 * @returns A '0x'-prefixed hex string.
 */
// TODO: Either fix this lint violation or explain why it's necessary to ignore.
// eslint-disable-next-line @typescript-eslint/naming-convention
export function BNToHex(inputBn: BN4): string {
  return add0x(inputBn.toString(16));
}

// Setter Maps
export const toBigNumber: Record<string, (n: string | number | BigNumber) => BigNumber> = {
  hex: (n) => new BigNumber(stripHexPrefix(String(n)), 16),
  dec: (n) => new BigNumber(String(n), 10),
  BN: (n) => new BigNumber(n.toString(16), 16),
};
const toNormalizedDenomination: Record<string, (bigNumber: BigNumber) => BigNumber> = {
  WEI: (bigNumber) => bigNumber.div(BIG_NUMBER_WEI_MULTIPLIER),
  GWEI: (bigNumber) => bigNumber.div(BIG_NUMBER_GWEI_MULTIPLIER),
  ETH: (bigNumber) => bigNumber.div(BIG_NUMBER_ETH_MULTIPLIER),
};
const toSpecifiedDenomination: Record<string, (bigNumber: BigNumber) => BigNumber> = {
  WEI: (bigNumber) =>
    bigNumber.times(BIG_NUMBER_WEI_MULTIPLIER).decimalPlaces(0),
  GWEI: (bigNumber) =>
    bigNumber.times(BIG_NUMBER_GWEI_MULTIPLIER).decimalPlaces(9),
  ETH: (bigNumber) =>
    bigNumber.times(BIG_NUMBER_ETH_MULTIPLIER).decimalPlaces(9),
};
const baseChange: Record<string, (n: BigNumber) => string | BN4> = {
  hex: (n) => n.toString(16),
  dec: (n) => new BigNumber(n).toString(10),
  BN: (n) => new BN4(n.toString(16)),
};

/**
 * Prefixes a hex string with '0x' or '-0x' and returns it. Idempotent.
 *
 * @param {string} str - The string to prefix.
 * @returns {string} The prefixed string.
 */
export const addHexPrefix = (str: string): string => {
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
 * @param {number|string|Object} value - Wei to convert
 * @param {string} unit - Unit to convert to, ether by default
 * @returns {string} - String containing the new number
 */
export function fromWei(value: number | string | BN4 = 0, unit = 'ether'): string {
  return convert.fromWei(value, unit);
}

/**
 * Converts token minimal unit to readable string value
 *
 * @param {number|string|Object} minimalInput - Token minimal unit to convert
 * @param {number|string} decimals - Token decimals to convert
 * @param {boolean} [isRounding=true] - If true, minimalInput is converted to number and rounded for large numbers.
 * @returns {string} - String containing the new number
 */
export function fromTokenMinimalUnit(
  minimalInput: number | string | BN4,
  decimals: number,
  isRounding = true,
): string {
  minimalInput = isRounding ? Number(minimalInput) : minimalInput;
  const prefixedInput = addHexPrefix(minimalInput.toString(16));
  let minimal = safeNumberToBN(prefixedInput);
  const negative = minimal.lt(new BN4(0));
  const base = toBN(Math.pow(10, decimals).toString());

  if (negative) {
    minimal = minimal.mul(negative);
  }
  let fraction = minimal.mod(base).toString(10);
  while (fraction.length < decimals) {
    fraction = '0' + fraction;
  }
  fraction = fraction.match(regex.fractions)[1];
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
 * @param {string} minimalInput - Token minimal unit to convert
 * @param {number} decimals - Token decimals to convert
 * @returns {string} - String containing the new number
 */
export function fromTokenMinimalUnitString(minimalInput: string, decimals: number): string {
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
 * @param {number|string|BN4} tokenValue - Value to convert
 * @param {number} decimals - Unit to convert from, ether by default
 * @returns {BN} - BN instance containing the new number
 */
export function toTokenMinimalUnit(tokenValue: number | string | BN4, decimals: number): BN4 {
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
  let whole = comps[0],
    fraction = comps[1];
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
  whole = new BN4(whole);
  fraction = new BN4(fraction);
  let tokenMinimal = whole.mul(base).add(fraction);
  if (negative) {
    tokenMinimal = tokenMinimal.mul(negative);
  }
  return new BN4(tokenMinimal.toString(10), 10);
}

/**
 * Converts some token minimal unit to render format string, showing 5 decimals
 *
 * @param {Number|String|BN4} tokenValue - Token value to convert
 * @param {Number} decimals - Token decimals to convert
 * @param {Number} decimalsToShow - Decimals to 5
 * @returns {String} - Number of token minimal unit, in render format
 * If value is less than 5 precision decimals will show '< 0.00001'
 */
export function renderFromTokenMinimalUnit(
  tokenValue: number | string | BN4,
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
 * @param {number} transferFiat - Number representing fiat value of a transfer
 * @param {number} feeFiat - Number representing fiat value of transaction fee
 * @param {string} currentCurrency - Currency
 * @param {number} decimalsToShow - Defaults to 5
 * @returns {String} - Formatted fiat value of the addition, in render format
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
 * @param {number} num
 * @param {number} maxDecimalPlaces
 * @returns {string}
 */
export function limitToMaximumDecimalPlaces(num: number, maxDecimalPlaces = 5): string | number {
  if (isNaN(num) || isNaN(maxDecimalPlaces)) {
    return num;
  }
  const base = Math.pow(10, maxDecimalPlaces);
  return (Math.round(num * base) / base).toString();
}

/**
 * Converts fiat number as human-readable fiat string to token miniml unit expressed as a BN
 *
 * @param {number|string} fiat - Fiat number
 * @param {number} conversionRate - ETH to current currency conversion rate
 * @param {number} exchangeRate - Asset to ETH conversion rate
 * @param {number} decimals - Asset decimals
 * @returns {Object} - The converted balance as BN instance
 */
export function fiatNumberToTokenMinimalUnit(
  fiat: number | string,
  conversionRate: number,
  exchangeRate: number,
  decimals: number,
) {
  const floatFiatConverted = parseFloat(fiat) / (conversionRate * exchangeRate);
  const base = Math.pow(10, decimals);
  let weiNumber = floatFiatConverted * base;
  // avoid decimals
  weiNumber = weiNumber.toLocaleString('fullwide', { useGrouping: false });
  const weiBN = safeNumberToBN(weiNumber);
  return weiBN;
}

/**
 * Converts wei to render format string, showing 5 decimals
 *
 * @param {Number|String|BN4} value - Wei to convert
 * @param {Number} decimalsToShow - Decimals to 5
 * @returns {String} - Number of token minimal unit, in render format
 * If value is less than 5 precision decimals will show '< 0.00001'
 */
export function renderFromWei(value: number | string | BN4 | undefined, decimalsToShow = 5): string {
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
 * @param {Object} value - BN instance to convert
 * @param {number} decimals - Decimals to be considered on the conversion
 * @returns {string} - String of the hex token value
 */
export function calcTokenValueToSend(value: number | undefined, decimals: number): string | number {
  return value ? (value * Math.pow(10, decimals)).toString(16) : 0;
}

/**
 * Checks if a value is a BN instance
 *
 * @param {object|string} value - Value to check
 * @returns {boolean} - True if the value is a BN instance
 */
export function isBN(value: unknown): boolean {
  return BN4.isBN(value);
}

/**
 * Determines if a string is a valid decimal
 *
 * @param {number | string} value - String to check
 * @returns {boolean} - True if the string is a valid decimal
 */
export function isDecimal(value: number | string): boolean {
  return (
    Number.isFinite(parseFloat(value)) &&
    !Number.isNaN(parseFloat(value)) &&
    !isNaN(+value)
  );
}

/**
 * Creates a BN object from a string
 *
 * @param {string} value - Some numeric value represented as a string
 * @returns {Object} - BN instance
 */
export function toBN(value: string | number): BN4 {
  return new BN4(value);
}

/**
 * Determines if a string is a valid number
 *
 * @param {*} str - Number string
 * @returns {boolean} - True if the string  is a valid number
 */
export function isNumber(str: string): boolean {
  return regex.number.test(str);
}

/**
 * Determines if a value is a number
 *
 * @param {number | string | null | undefined} value - Value to check
 * @returns {boolean} - True if the value is a valid number
 */
export function isNumberValue(value: number | string | null | undefined): boolean {
  if (value === null || value === undefined) { return false; }

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
 * @param {number} value - The value to check.
 * @returns {boolean} True if the value is a number in scientific notation, false otherwise.
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
 * @param {number|string|BN4} value - Value to convert
 * @param {string} unit - Unit to convert from, ether by default
 * @returns {BN4} - BN instance containing the new number
 */
export function toWei(value: number | string, unit = 'ether') {
  // check the posibilty to convert to BN
  // directly on the swaps screen
  if (isNumberScientificNotationWhenString(value)) {
    value = value.toFixed(18);
  }
  return convert.toWei(value, unit);
}

/**
 * Converts some unit to Gwei
 *
 * @param {number|string|BN4} value - Value to convert
 * @param {string} unit - Unit to convert from, ether by default
 * @returns {Object} - BN instance containing the new number
 */
export function toGwei(value: number | string | BN4, unit = 'ether'): number {
  return fromWei(value, unit) * 1000000000;
}

/**
 * Converts some unit to Gwei and return it in render format
 *
 * @param {number|string|BN4} value - Value to convert
 * @param {string} unit - Unit to convert from, ether by default
 * @returns {string} - String instance containing the renderable number
 */
export function renderToGwei(value: number | string | BN4, unit = 'ether'): number {
  const gwei = fromWei(value, unit) * 1000000000;
  let gweiFixed = parseFloat(Math.round(gwei));
  gweiFixed = isNaN(gweiFixed) ? 0 : gweiFixed;
  return gweiFixed;
}

/**
 * Converts wei expressed as a BN instance into a human-readable fiat string
 * TODO: wei should be a BN instance, but we're not sure if it's always the case
//
 * @param {number | BN4} wei - BN corresponding to an amount of wei
 * @param {number | null} conversionRate - ETH to current currency conversion rate
 * @param {string} currencyCode - Current currency code to display
 * @returns {string} - Currency-formatted string
 */
export function weiToFiat(
  wei: number | string | BN4 | undefined,
  conversionRate: number | null = null,
  currencyCode: string,
  decimalsToShow = 5,
): string | undefined {
  if (!conversionRate) return undefined;
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
 * @param {number|string} amount  Number corresponding to a currency amount
 * @param {string} currencyCode Current currency code to display
 * @returns {string} - Currency-formatted string
 */
export function addCurrencySymbol(
  amount: number | string,
  currencyCode: string,
  extendDecimals = false,
): string {
  const prefix = parseFloat(amount) < 0 ? '-' : '';
  if (extendDecimals) {
    if (isNumberScientificNotationWhenString(amount)) {
      amount = amount.toFixed(18);
    }

    // if bigger than 0.01, show 2 decimals
    if (amount >= 0.01 || amount <= -0.01) {
      amount = parseFloat(amount).toFixed(2);
    }

    // if less than 0.01, show all the decimals that are zero except the trailing zeros, and 3 decimals for the rest that are not zero
    if ((amount < 0.01 && amount > 0) || (amount > -0.01 && amount < 0)) {
      const decimalString = amount.toString().split('.')[1];
      if (decimalString && decimalString.length > 1) {
        const firstNonZeroDecimal = decimalString.indexOf(
          decimalString.match(regex.decimalString)[0],
        );
        if (firstNonZeroDecimal > 0) {
          amount = parseFloat(amount).toFixed(firstNonZeroDecimal + 3);
          // remove trailing zeros
          amount = amount.replace(regex.trailingZero, '');
        }
      }
    }
  }

  if (currencyCode === 'usd' && !extendDecimals) {
    amount = parseFloat(amount).toFixed(2);
  }

  const amountString = amount.toString();
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
 * @param {number|string|BN4} wei - BN corresponding to an amount of wei
 * @param {number} conversionRate - ETH to current currency conversion rate
 * @param {Number} decimalsToShow - Decimals to 5
 * @returns {Number} - The converted balance
 */
export function weiToFiatNumber(wei: number | string | BN4, conversionRate: number, decimalsToShow = 5): number {
  const base = Math.pow(10, decimalsToShow);
  const eth = fromWei(wei).toString();
  let value = parseFloat(Math.floor(eth * conversionRate * base) / base);
  value = isNaN(value) ? 0.0 : value;
  return value;
}

/**
 * Handles wie input to have less or equal to 18 decimals
 *
 * @param {string} wei - Amount in decimal notation
 * @returns {string} - Number string with less or equal 18 decimals
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
 * @param {number|string} fiat - Fiat number
 * @param {number} conversionRate - ETH to current currency conversion rate
 * @returns {Object} - The converted balance as BN instance
 */
export function fiatNumberToWei(fiat: number | string, conversionRate: number) {
  const floatFiatConverted = parseFloat(fiat) / conversionRate;
  if (
    !floatFiatConverted ||
    isNaN(floatFiatConverted) ||
    floatFiatConverted === Infinity
  ) {
    return '0x0';
  }
  const base = Math.pow(10, 18);
  let weiNumber = Math.trunc(base * floatFiatConverted);
  // avoid decimals
  weiNumber = weiNumber.toLocaleString('fullwide', { useGrouping: false });
  const weiBN = safeNumberToBN(weiNumber);
  return weiBN;
}

/**
 * Wraps 'numberToBN' method to avoid potential undefined and decimal values
 *
 * @param {number|string} value -  number
 * @returns {Object} - The converted value as BN instance
 */
export function safeNumberToBN(value: number | string | undefined) {
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
 * @param {number|string} value -  number/string to be splitted
 * @param {string} divider -  string value to use to split the string (default '.')
 * @returns {string} - the selected splitted element
 */

export function fastSplit(value: string, divider = '.'): string {
  const [from, to] = [value.indexOf(divider), 0];
  return value.substring(from, to) || value;
}

/**
 * Calculates fiat balance of an asset
 *
 * @param {number|string} balance - Number corresponding to a balance of an asset
 * @param {number|null|undefined} conversionRate - ETH to current currency conversion rate
 * @param {number|undefined} exchangeRate - Asset to ETH conversion rate
 * @param {string} currencyCode - Current currency code to display
 * @returns {string} - Currency-formatted string
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
  const fiatFixed = balanceToFiatNumber(balance, conversionRate, exchangeRate);
  return addCurrencySymbol(fiatFixed, currencyCode);
}

/**
 * Calculates fiat balance of an asset and returns a number
 *
 * @param {number|string} balance - Number or string corresponding to a balance of an asset
 * @param {number} conversionRate - ETH to current currency conversion rate
 * @param {number} exchangeRate - Asset to ETH conversion rate
 * @param {number} decimalsToShow - Decimals to 5
 * @returns {Number} - The converted balance
 */
export function balanceToFiatNumber(
  balance: number | string,
  conversionRate: number,
  exchangeRate: number,
  decimalsToShow = 5,
): number {
  const base = Math.pow(10, decimalsToShow);
  let fiatFixed = parseFloat(
    Math.floor(balance * conversionRate * exchangeRate * base) / base,
  );
  fiatFixed = isNaN(fiatFixed) ? 0.0 : fiatFixed;
  return fiatFixed;
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
 * @param {number} value - number corresponding to a balance of an asset
 * @param {string} currencyCode - Current currency code to display
 * @param {number} decimalsToShow - Decimals to 5
 * @returns {string} - The converted balance
 */
export function renderFiat(value: number, currencyCode: string, decimalsToShow = 5): string {
  const base = Math.pow(10, decimalsToShow);
  let fiatFixed = parseFloat(Math.round(value * base) / base);
  fiatFixed = isNaN(fiatFixed) ? 0.0 : fiatFixed;
  if (currencySymbols[currencyCode]) {
    return `${currencySymbols[currencyCode]}${fiatFixed}`;
  }
  return `${fiatFixed} ${currencyCode.toUpperCase()}`;
}

/**
 * Converts BN wei value to wei units in string format
 *
 * @param {object} value - Object containing wei value in BN format
 * @returns {string} - Corresponding wei value
 */
export function renderWei(value: number | string | BN4 | undefined): string {
  if (!value) return '0';
  const wei = fromWei(value);
  const renderWei = wei * Math.pow(10, 18);
  return renderWei.toString();
}
/**
 * Format a string number in an string number with at most 5 decimal places
 *
 * @param {string} number - String containing a number
 * @returns {string} - String number with none or at most 5 decimal places
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
 * @param {any} value - The value to check.
 * @returns {boolean} True if the value is a correctly formatted hex string,
 * false otherwise.
 */
export function isPrefixedFormattedHexString(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false;
  }
  return regex.prefixedFormattedHexString.test(value);
}

interface NumberConversionInput {
  value: string | number | BigNumber;
  fromNumericBase?: string;
  fromDenomination?: string;
  fromCurrency?: string | null;
  toNumericBase?: string;
  toDenomination?: string;
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
}: NumberConversionInput) => {
  let convertedValue = fromNumericBase
    ? toBigNumber[fromNumericBase](value)
    : value;

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
    convertedValue = baseChange[toNumericBase](convertedValue);
  }
  return convertedValue;
};

export const conversionUtil = (
  value: string | number | BigNumber,
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
  }: Omit<NumberConversionInput, 'value'>,
) =>
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

export const toHexadecimal = (decimal: string | number | undefined): string | number | undefined => {
  if (!decimal) return decimal;
  if (decimal !== typeof 'string') {
    decimal = String(decimal);
  }
  if (decimal.startsWith('0x')) return decimal;
  return toBigNumber.dec(decimal).toString(16);
};

export const calculateEthFeeForMultiLayer = ({
  multiLayerL1FeeTotal,
  ethFee = 0,
}: {
  multiLayerL1FeeTotal?: string;
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
 * @param {number|string|object} value - Value to check
 * @returns {boolean} - true if value is zero
 */
export const isZeroValue = (value: string | number | BN4 | null | undefined): boolean => {
  if (value === null || value === undefined) {
    return false;
  }
  return value === '0x0' || (isBN(value) && value.isZero()) || isZero(value);
};

export const formatValueToMatchTokenDecimals = (value: string | null | undefined, decimal: number): string | null | undefined => {
  if (value === null || value === undefined) {
    return value;
  }
  const decimalIndex = value.indexOf('.');
  if (decimalIndex !== -1) {
    const fractionalLength = value.substring(decimalIndex + 1).length;
    if (fractionalLength > decimal) {
      value = parseFloat(value).toFixed(decimal);
    }
  }
  return value;
};

export const safeBNToHex = (value: BN4 | null | undefined): string | null | undefined => {
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
export const localizeLargeNumber = (i18n: { t: (key: string) => string }, number: number): string => {
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
