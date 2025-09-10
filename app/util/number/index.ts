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
export const hexToBN = (inputHex: string | number | any): any =>
  typeof inputHex !== 'string'
    ? new BN4(inputHex as any, 16)
    : inputHex
    ? new BN4(remove0x(inputHex), 16)
    : new BN4(0);

/**
 * Converts a BN object to a hex string with a '0x' prefix.
 *
 * @param inputBn - BN instance to convert to a hex string.
 * @returns A '0x'-prefixed hex string.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function BNToHex(inputBn: { toString: (radix?: number) => string }): string {
  return add0x(inputBn.toString(16));
}

// Setter Maps
export const toBigNumber = {
  hex: (n: string): any => new BigNumber(stripHexPrefix(n), 16),
  dec: (n: string | number): any => new BigNumber(String(n), 10),
  BN: (n: any): any => new BigNumber(n.toString(16), 16),
} as const;

const toNormalizedDenomination = {
  WEI: (bigNumber: any): any => bigNumber.div(BIG_NUMBER_WEI_MULTIPLIER),
  GWEI: (bigNumber: any): any => bigNumber.div(BIG_NUMBER_GWEI_MULTIPLIER),
  ETH: (bigNumber: any): any => bigNumber.div(BIG_NUMBER_ETH_MULTIPLIER),
} as const;

const toSpecifiedDenomination = {
  WEI: (bigNumber: any): any =>
    bigNumber.times(BIG_NUMBER_WEI_MULTIPLIER).decimalPlaces(0),
  GWEI: (bigNumber: any): any =>
    bigNumber.times(BIG_NUMBER_GWEI_MULTIPLIER).decimalPlaces(9),
  ETH: (bigNumber: any): any =>
    bigNumber.times(BIG_NUMBER_ETH_MULTIPLIER).decimalPlaces(9),
} as const;

const baseChange: Record<'hex' | 'dec' | 'BN', (n: any) => any> = {
  hex: (n: any): string => n.toString(16),
  dec: (n: any): string => new BigNumber(n).toString(10),
  BN: (n: any): any => new BN4(n.toString(16)),
};

/**
 * Prefixes a hex string with '0x' or '-0x' and returns it. Idempotent.
 *
 * @param str - The string to prefix.
 * @returns The prefixed string.
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
 * @param value - Wei to convert
 * @param unit - Unit to convert to, ether by default
 * @returns String containing the new number
 */
export function fromWei(value: number | string | any = 0, unit: string = 'ether'): string {
  return convert.fromWei(value as any, unit) as unknown as string;
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
  minimalInput: number | string | any,
  decimals: number,
  isRounding: boolean = true,
): string {
  const coercedMinimalInput = isRounding ? Number(minimalInput as any) : (minimalInput as any);
  const prefixedInput = addHexPrefix(coercedMinimalInput.toString(16));
  let minimal = safeNumberToBN(prefixedInput) as any;
  const negative = minimal.lt(new BN4(0));
  const base = toBN(Math.pow(10, decimals).toString()) as any;

  if (negative) {
    minimal = minimal.mul(negative as any);
  }
  let fraction = minimal.mod(base).toString(10);
  while (fraction.length < decimals) {
    fraction = '0' + fraction;
  }
  fraction = fraction.match(regex.fractions)![1];
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
 * @param tokenValue - Value to convert
 * @param decimals - Unit to convert from, ether by default
 * @returns BN instance containing the new number
 */
export function toTokenMinimalUnit(tokenValue: number | string | any, decimals: number): any {
  const base = toBN(Math.pow(10, decimals).toString()) as any;
  let value = convert.numberToString(tokenValue as any);
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
  const wholeBN = new BN4(whole);
  const fractionBN = new BN4(fraction);
  let tokenMinimal = wholeBN.mul(base).add(fractionBN);
  if (negative) {
    tokenMinimal = tokenMinimal.mul(negative as any);
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
  tokenValue: number | string | any,
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
  if ((currencySymbols as any)[currentCurrency]) {
    return `${(currencySymbols as any)[currentCurrency]}${renderMinimalUnit}`;
  }
  return `${renderMinimalUnit} ${currentCurrency}`;
}

/**
 * Limits a number to a max decimal places.
 */
export function limitToMaximumDecimalPlaces(num: number, maxDecimalPlaces: number = 5): string {
  // Preserve legacy behavior for invalid input
  if (Number.isNaN(num) || Number.isNaN(maxDecimalPlaces as any)) {
    return (num as any) as string;
  }
  const base = Math.pow(10, maxDecimalPlaces);
  return (Math.round(num * base) / base).toString();
}

/**
 * Converts fiat number as human-readable fiat string to token miniml unit expressed as a BN
 */
export function fiatNumberToTokenMinimalUnit(
  fiat: number | string,
  conversionRate: number,
  exchangeRate: number,
  decimals: number,
): any {
  const floatFiatConverted = parseFloat(fiat as any) / (conversionRate * exchangeRate);
  const base = Math.pow(10, decimals);
  let weiNumber = floatFiatConverted * base;
  // avoid decimals
  weiNumber = Number(weiNumber).toLocaleString('fullwide', { useGrouping: false }) as any as number;
  const weiBN = safeNumberToBN(weiNumber as any);
  return weiBN;
}

/**
 * Converts wei to render format string, showing 5 decimals
 */
export function renderFromWei(value: number | string | any, decimalsToShow: number = 5): string {
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
 */
export function calcTokenValueToSend(value: any, decimals: number): string | 0 {
  return value ? (value * Math.pow(10, decimals)).toString(16) : 0;
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
    Number.isFinite(parseFloat(value as any)) &&
    !Number.isNaN(parseFloat(value as any)) &&
    !isNaN(+((value as unknown) as any))
  );
}

/**
 * Creates a BN object from a string
 */
export function toBN(value: string | number): any {
  return new BN4(value as any);
}

/**
 * Determines if a string is a valid number
 */
export function isNumber(str: unknown): boolean {
  return regex.number.test(str as any);
}

/**
 * Determines if a value is a number
 */
export function isNumberValue(value: number | string | null | undefined): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === 'number') {
    return !Number.isNaN(value) && Number.isFinite(value);
  }

  return isDecimal(value);
}

export const dotAndCommaDecimalFormatter = (value: number | string): string => {
  const valueStr = String(value);
  const formattedValue = valueStr.replace(',', '.');
  return formattedValue;
};

/**
 * Determines whether the given number is going to be
 * displalyed in scientific notation after being converted to a string.
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
 */
export function toWei(value: number | string | any, unit: string = 'ether'): any {
  // check the posibilty to convert to BN directly on the swaps screen
  if (isNumberScientificNotationWhenString(value)) {
    value = (value as number).toFixed(18) as any;
  }
  return convert.toWei(value as any, unit) as unknown as any;
}

/**
 * Converts some unit to Gwei
 */
export function toGwei(value: number | string | any, unit: string = 'ether'): number {
  return (fromWei(value as any, unit) as any) * 1000000000;
}

/**
 * Converts some unit to Gwei and return it in render format
 */
export function renderToGwei(value: number | string | any, unit: string = 'ether'): number {
  const gwei = (fromWei(value as any, unit) as any) * 1000000000;
  let gweiFixed = parseFloat(Math.round(gwei) as any);
  gweiFixed = isNaN(gweiFixed) ? 0 : gweiFixed;
  return gweiFixed;
}

/**
 * Converts wei expressed as a BN instance into a human-readable fiat string
 */
export function weiToFiat(
  wei: number | string | any,
  conversionRate: number | null = null,
  currencyCode: string,
  decimalsToShow: number = 5,
): string | undefined {
  if (!conversionRate) return undefined;
  if (!wei || !isBN(wei) || !conversionRate) {
    return addCurrencySymbol(0, currencyCode);
  }
  // eslint-disable-next-line no-param-reassign
  decimalsToShow = (currencyCode === 'usd' && 2) || undefined as any;
  const value = weiToFiatNumber(wei as any, conversionRate, decimalsToShow as any);
  return addCurrencySymbol(value, currencyCode);
}

/**
 * Renders fiat amount with currency symbol if exists
 */
export function addCurrencySymbol(
  amount: number | string,
  currencyCode: string,
  extendDecimals: boolean = false,
): string {
  let workingAmount: any = amount as any;
  const prefix = parseFloat(workingAmount) < 0 ? '-' : '';
  if (extendDecimals) {
    if (isNumberScientificNotationWhenString(workingAmount)) {
      workingAmount = (workingAmount as number).toFixed(18);
    }

    // if bigger than 0.01, show 2 decimals
    if (workingAmount >= 0.01 || workingAmount <= -0.01) {
      workingAmount = parseFloat(workingAmount).toFixed(2);
    }

    // if less than 0.01, show all the decimals that are zero except the trailing zeros, and 3 decimals for the rest that are not zero
    if ((workingAmount < 0.01 && workingAmount > 0) || (workingAmount > -0.01 && workingAmount < 0)) {
      const decimalString = workingAmount.toString().split('.')[1];
      if (decimalString && decimalString.length > 1) {
        const firstNonZeroDecimal = decimalString.indexOf(
          decimalString.match(regex.decimalString)![0],
        );
        if (firstNonZeroDecimal > 0) {
          workingAmount = parseFloat(workingAmount).toFixed(firstNonZeroDecimal + 3);
          // remove trailing zeros
          workingAmount = workingAmount.replace(regex.trailingZero, '');
        }
      }
    }
  }

  if (currencyCode === 'usd' && !extendDecimals) {
    workingAmount = parseFloat(workingAmount).toFixed(2);
  }

  const amountString = workingAmount.toString();
  const absAmountStr = amountString.startsWith('-')
    ? amountString.slice(1) // Remove the first character if it's a '-'
    : amountString;

  if ((currencySymbols as any)[currencyCode]) {
    return `${prefix}${(currencySymbols as any)[currencyCode]}${absAmountStr}`;
  }

  const lowercaseCurrencyCode = currencyCode?.toLowerCase();

  if ((currencySymbols as any)[lowercaseCurrencyCode]) {
    return `${prefix}${(currencySymbols as any)[lowercaseCurrencyCode]}${absAmountStr}`;
  }

  return `${prefix}${absAmountStr} ${currencyCode}`;
}

/**
 * Converts wei expressed as a BN instance into a human-readable fiat string
 */
export function weiToFiatNumber(
  wei: number | string | any,
  conversionRate: number,
  decimalsToShow: number = 5,
): number {
  const base = Math.pow(10, decimalsToShow);
  const eth = fromWei(wei as any).toString();
  let value = parseFloat(Math.floor(((eth as any) * conversionRate * base) as any) / base as any);
  value = isNaN(value) ? 0.0 : value;
  return value;
}

/**
 * Handles wie input to have less or equal to 18 decimals
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
 */
export function fiatNumberToWei(fiat: number | string, conversionRate: number): any | '0x0' {
  const floatFiatConverted = parseFloat(fiat as any) / conversionRate;
  if (!floatFiatConverted || isNaN(floatFiatConverted) || floatFiatConverted === Infinity) {
    return '0x0';
  }
  const base = Math.pow(10, 18);
  let weiNumber = Math.trunc(base * floatFiatConverted);
  // avoid decimals
  weiNumber = Number(weiNumber).toLocaleString('fullwide', { useGrouping: false }) as any as number;
  const weiBN = safeNumberToBN(weiNumber as any);
  return weiBN;
}

/**
 * Wraps 'numberToBN' method to avoid potential undefined and decimal values
 */
export function safeNumberToBN(value: number | string): any {
  try {
    const safeValue = fastSplit(value?.toString()) || '0';
    return numberToBN(safeValue) as any;
  } catch {
    return numberToBN('0') as any;
  }
}

/**
 * Performs a fast string split and returns the first item of the string based on the divider provided
 */
export function fastSplit(value: string, divider: string = '.'): string {
  const from = value.indexOf(divider);
  const to = 0;
  return value.substring(from, to) || value;
}

/**
 * Calculates fiat balance of an asset
 */
export function balanceToFiat(
  balance: number | string,
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
    balance as any,
    conversionRate as number,
    exchangeRate as number,
  );
  return addCurrencySymbol(fiatFixed, currencyCode);
}

/**
 * Calculates fiat balance of an asset and returns a number
 */
export function balanceToFiatNumber(
  balance: number | string,
  conversionRate: number,
  exchangeRate: number,
  decimalsToShow: number = 5,
): number {
  const base = Math.pow(10, decimalsToShow);
  let fiatFixed = parseFloat(
    (Math.floor((balance as any) * conversionRate * exchangeRate * base) / base) as any,
  );
  fiatFixed = isNaN(fiatFixed) ? 0.0 : fiatFixed;
  return fiatFixed;
}

export function getCurrencySymbol(currencyCode: string): string {
  if ((currencySymbols as any)[currencyCode]) {
    return `${(currencySymbols as any)[currencyCode]}`;
  }
  return currencyCode;
}

/**
 * Formats a fiat value into a string ready to be rendered
 */
export function renderFiat(value: number, currencyCode: string, decimalsToShow: number = 5): string {
  const base = Math.pow(10, decimalsToShow);
  let fiatFixed = parseFloat((Math.round(value * base) / base) as any);
  fiatFixed = isNaN(fiatFixed) ? 0.0 : fiatFixed;
  if ((currencySymbols as any)[currencyCode]) {
    return `${(currencySymbols as any)[currencyCode]}${fiatFixed}`;
  }
  return `${fiatFixed} ${currencyCode.toUpperCase()}`;
}

/**
 * Converts BN wei value to wei units in string format
 */
export function renderWei(value: number | string | any): string {
  if (!value) return '0';
  const wei = fromWei(value as any);
  const renderWei = (wei as any) * Math.pow(10, 18);
  return renderWei.toString();
}

/**
 * Format a string number in an string number with at most 5 decimal places
 */
export function renderNumber(number: string): string {
  const index = number.indexOf('.');
  if (index === 0) return number;
  return number.substring(0, index + 6);
}

/**
 * Checks whether the given value is a 0x-prefixed, non-zero, non-zero-padded,
 * hexadecimal string.
 */
export function isPrefixedFormattedHexString(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false;
  }
  return regex.prefixedFormattedHexString.test(value);
}

type NumericBase = 'hex' | 'dec' | 'BN';
type Denomination = 'WEI' | 'GWEI' | 'ETH';

type ConversionParams = {
  fromCurrency?: string | null;
  toCurrency?: string | null;
  fromNumericBase?: NumericBase;
  toNumericBase?: NumericBase;
  fromDenomination?: Denomination;
  toDenomination?: Denomination;
  numberOfDecimals?: number;
  conversionRate?: number;
  invertConversionRate?: boolean;
  roundDown?: number;
};

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
}: {
  value: string | number | any;
  fromNumericBase?: NumericBase;
  fromDenomination?: Denomination;
  fromCurrency?: string | null;
  toNumericBase?: NumericBase;
  toDenomination?: Denomination;
  toCurrency?: string | null;
  numberOfDecimals?: number;
  conversionRate?: number;
  invertConversionRate?: boolean;
  roundDown?: number;
}): any => {
  let convertedValue: any = fromNumericBase
    ? (toBigNumber as any)[fromNumericBase](value as any)
    : value;

  if (fromDenomination) {
    convertedValue = (toNormalizedDenomination as any)[fromDenomination](convertedValue);
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
    convertedValue = (toSpecifiedDenomination as any)[toDenomination](convertedValue);
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
  value: string | number | any,
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
  }: ConversionParams,
): any =>
  converter({
    fromCurrency: fromCurrency ?? null,
    toCurrency: toCurrency ?? null,
    fromNumericBase,
    toNumericBase,
    fromDenomination,
    toDenomination,
    numberOfDecimals,
    conversionRate,
    invertConversionRate,
    value: (value as any) || '0',
  });

export const toHexadecimal = (decimal: string | number): string => {
  if (!decimal) return decimal as any;
  if (decimal !== (typeof 'string')) {
    decimal = String(decimal);
  }
  if ((decimal as string).startsWith('0x')) return decimal as string;
  return toBigNumber.dec(decimal as string).toString(16);
};

export const calculateEthFeeForMultiLayer = ({
  multiLayerL1FeeTotal,
  ethFee = 0,
}: {
  multiLayerL1FeeTotal?: string | number | any;
  ethFee?: number | string;
}): string | number => {
  if (!multiLayerL1FeeTotal) {
    return ethFee;
  }
  const multiLayerL1FeeTotalDecEth = conversionUtil(multiLayerL1FeeTotal as any, {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
    fromDenomination: 'WEI',
    toDenomination: 'ETH',
  });
  return new BigNumber(multiLayerL1FeeTotalDecEth)
    .plus(new BigNumber((ethFee as any) ?? 0))
    .toString(10);
};

/**
 * @param value - Value to check
 * @returns true if value is zero
 */
export const isZeroValue = (value: any): boolean => {
  if (value === null || value === undefined) {
    return false;
  }
  return value === '0x0' || (isBN(value) && (value as any).isZero()) || isZero(value as any);
};

export const formatValueToMatchTokenDecimals = (
  value: string | null | undefined,
  decimal: number,
): string | null | undefined => {
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

export const safeBNToHex = (value: any | null | undefined): string | null | undefined => {
  if (value === null || value === undefined) {
    return value as any;
  }

  return BNToHex(value);
};

/**
 * Formats a potentially large number to the nearest unit.
 * e.g. 1T for trillions, 2.3B for billions, 4.56M for millions, 7,890 for thousands, etc.
 *
 * @param i18n - An I18nContext translator.
 * @param number - The number to format.
 * @returns A localized string of the formatted number + unit.
 */
export const localizeLargeNumber = (i18n: any, number: number): string => {
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

