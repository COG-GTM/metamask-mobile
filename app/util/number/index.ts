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

// Numeric values accepted by the conversion utilities. Includes the full
// `BN.js` BigInteger API surface so that BN instances coming from any
// version of `bn.js` / `bnjs4` / `ethereumjs-util` are accepted.
type Numeric =
  | string
  | number
  | BN4
  | BigNumber
  | { toString: (radix?: number) => string };

const currencySymbolsMap = currencySymbols as unknown as Record<string, string>;

/**
 * Converts a hex string to a BN object.
 * Adapt function with non string argument handler
 */
export const hexToBN = (
  inputHex: string | number | BN4 | undefined,
): BN4 =>
  typeof inputHex !== 'string'
    ? new BN4((inputHex ?? 0) as number, 16)
    : inputHex
    ? new BN4(remove0x(inputHex), 16)
    : new BN4(0);

/**
 * Converts a BN object to a hex string with a '0x' prefix.
 */
// TODO: Either fix this lint violation or explain why it's necessary to ignore.
// eslint-disable-next-line @typescript-eslint/naming-convention
export function BNToHex(inputBn: {
  toString: (radix?: number) => string;
}): `0x${string}` {
  return add0x(inputBn.toString(16)) as `0x${string}`;
}

// Setter Maps
export const toBigNumber: Record<string, (n: Numeric) => BigNumber> = {
  hex: (n) => new BigNumber(stripHexPrefix(n as string), 16),
  dec: (n) => new BigNumber(String(n), 10),
  BN: (n) => new BigNumber((n as BN4).toString(16), 16),
};
const toNormalizedDenomination: Record<
  string,
  (bigNumber: BigNumber) => BigNumber
> = {
  WEI: (bigNumber) => bigNumber.div(BIG_NUMBER_WEI_MULTIPLIER),
  GWEI: (bigNumber) => bigNumber.div(BIG_NUMBER_GWEI_MULTIPLIER),
  ETH: (bigNumber) => bigNumber.div(BIG_NUMBER_ETH_MULTIPLIER),
};
const toSpecifiedDenomination: Record<
  string,
  (bigNumber: BigNumber) => BigNumber
> = {
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
 */
export function fromWei(
  value: Numeric | undefined = 0,
  unit: string = 'ether',
): string {
  return convert.fromWei((value ?? 0) as never, unit);
}

/**
 * Converts token minimal unit to readable string value
 */
export function fromTokenMinimalUnit(
  minimalInput: Numeric | undefined,
  decimals: number,
  isRounding: boolean = true,
): string {
  if (minimalInput === undefined) {
    minimalInput = 0;
  }
  const minimalRounded: Numeric = isRounding
    ? Number(minimalInput)
    : minimalInput;
  const prefixedInput = addHexPrefix((minimalRounded as number).toString(16));
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
 */
export function toTokenMinimalUnit(
  tokenValue: Numeric,
  decimals: number,
): BN4 {
  const base = toBN(Math.pow(10, decimals).toString());
  let value: string = convert.numberToString(tokenValue as never);
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
        tokenValue +
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
 */
export function renderFromTokenMinimalUnit(
  tokenValue: Numeric,
  decimals: number,
  decimalsToShow: number = 5,
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
 */
export function renderFiatAddition(
  transferFiat: number,
  feeFiat: number,
  currentCurrency: string,
  decimalsToShow: number = 5,
): string {
  const base = Math.pow(10, decimalsToShow);
  const fiatFixed = Math.round((transferFiat + feeFiat) * base) / base;
  if (currencySymbolsMap[currentCurrency]) {
    return `${currencySymbolsMap[currentCurrency]}${fiatFixed}`;
  }
  return `${fiatFixed} ${currentCurrency.toUpperCase()}`;
}

/**
 * Limit number of decimals
 */
export function limitToMaximumDecimalPlaces(
  num: number,
  maxDecimalPlaces: number = 5,
): string {
  if (!num || isNaN(num)) return '0';
  return num.toFixed(maxDecimalPlaces).replace(regex.trailingZero, '');
}

/**
 * Converts a fiat amount to its corresponding value
 */
export function fiatNumberToTokenMinimalUnit(
  fiat: Numeric,
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
 */
export function renderFromWei(
  value: Numeric,
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
 */
export function calcTokenValueToSend(
  value: number | BN4 | undefined,
  decimals: number,
): string | number {
  return value
    ? ((value as unknown as number) * Math.pow(10, decimals)).toString(16)
    : 0;
}

/**
 * Checks if a value is a BN instance
 */
export function isBN(value: unknown): value is BN4 {
  return BN4.isBN(value as BN4);
}

/**
 * Determines if a string is a valid decimal
 */
export function isDecimal(value: string | number): boolean {
  return (
    Number.isFinite(parseFloat(value as string)) &&
    !Number.isNaN(parseFloat(value as string)) &&
    !isNaN(+value)
  );
}

/**
 * Creates a BN object from a string
 */
export function toBN(value: string | number): BN4 {
  return new BN4(value);
}

/**
 * Determines if a string is a valid number
 */
export function isNumber(str: string | null | undefined): boolean {
  if (str === null || str === undefined) return false;
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
 */
export function toWei(value: Numeric, unit: string = 'ether'): BN4 {
  // check the posibilty to convert to BN
  // directly on the swaps screen
  if (isNumberScientificNotationWhenString(value)) {
    value = (value as number).toFixed(18);
  }
  return convert.toWei(value as never, unit);
}

/**
 * Converts some unit to Gwei
 */
export function toGwei(value: Numeric, unit: string = 'ether'): number {
  return (parseFloat(fromWei(value, unit)) as number) * 1000000000;
}

/**
 * Converts some unit to Gwei and return it in render format
 */
export function renderToGwei(value: Numeric, unit: string = 'ether'): number {
  const gwei = parseFloat(fromWei(value, unit)) * 1000000000;
  let gweiFixed: number = parseFloat(String(Math.round(gwei)));
  gweiFixed = isNaN(gweiFixed) ? 0 : gweiFixed;
  return gweiFixed;
}

/**
 * Converts wei expressed as a BN instance into a human-readable fiat string
 */
/* eslint-disable @typescript-eslint/default-param-last */
export function weiToFiat(
  wei: BN4 | number | undefined,
  conversionRate: number | null = null,
  currencyCode: string,
  decimalsToShow: number = 5,
): string {
  /* eslint-enable @typescript-eslint/default-param-last */
  if (!conversionRate) return '';
  if (!wei || !isBN(wei) || !conversionRate) {
    return addCurrencySymbol(0, currencyCode);
  }
  decimalsToShow = ((currencyCode === 'usd' && 2) || undefined) as number;
  const value = weiToFiatNumber(wei, conversionRate, decimalsToShow);
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
  const prefix = parseFloat(amount as string) < 0 ? '-' : '';
  let amt: number | string = amount;
  if (extendDecimals) {
    if (isNumberScientificNotationWhenString(amt)) {
      amt = (amt as number).toFixed(18);
    }

    // if bigger than 0.01, show 2 decimals
    if ((amt as number) >= 0.01 || (amt as number) <= -0.01) {
      amt = parseFloat(amt as string).toFixed(2);
    }

    // if less than 0.01, show all the decimals that are zero except the trailing zeros, and 3 decimals for the rest that are not zero
    if (
      ((amt as number) < 0.01 && (amt as number) > 0) ||
      ((amt as number) > -0.01 && (amt as number) < 0)
    ) {
      const decimalString = amt.toString().split('.')[1];
      if (decimalString && decimalString.length > 1) {
        const decimalMatch = decimalString.match(regex.decimalString);
        const firstNonZeroDecimal = decimalMatch
          ? decimalString.indexOf(decimalMatch[0])
          : -1;
        if (firstNonZeroDecimal > 0) {
          amt = parseFloat(amt as string).toFixed(firstNonZeroDecimal + 3);
          // remove trailing zeros
          amt = amt.replace(regex.trailingZero, '');
        }
      }
    }
  }

  if (currencyCode === 'usd' && !extendDecimals) {
    amt = parseFloat(amt as string).toFixed(2);
  }

  const amountString = amt.toString();
  const absAmountStr = amountString.startsWith('-')
    ? amountString.slice(1) // Remove the first character if it's a '-'
    : amountString;

  if (currencySymbolsMap[currencyCode]) {
    return `${prefix}${currencySymbolsMap[currencyCode]}${absAmountStr}`;
  }

  const lowercaseCurrencyCode = currencyCode?.toLowerCase();

  if (currencySymbolsMap[lowercaseCurrencyCode]) {
    return `${prefix}${currencySymbolsMap[lowercaseCurrencyCode]}${absAmountStr}`;
  }

  return `${prefix}${absAmountStr} ${currencyCode}`;
}

/**
 * Converts wei expressed as a BN instance into a human-readable fiat string
 */
export function weiToFiatNumber(
  wei: BN4 | number | string,
  conversionRate: number,
  decimalsToShow: number = 5,
): number {
  const base = Math.pow(10, decimalsToShow);
  const eth = fromWei(wei).toString();
  let value = parseFloat(
    String(Math.floor((eth as unknown as number) * conversionRate * base) / base),
  );
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
 */
export function safeNumberToBN(value: number | string | null | undefined): BN4 {
  try {
    const safeValue = fastSplit(value?.toString() ?? '0') || '0';
    return numberToBN(safeValue);
  } catch {
    return numberToBN('0');
  }
}

/**
 * Performs a fast string split and returns the first item of the string based on the divider provided
 */
export function fastSplit(value: string, divider: string = '.'): string {
  const [from, to] = [value.indexOf(divider), 0];
  return value.substring(from, to) || value;
}

/**
 * Calculates fiat balance of an asset
 */
export function balanceToFiat(
  balance: number | string | undefined | null,
  conversionRate: number | undefined | null,
  exchangeRate: number | undefined | null,
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
        (balance as unknown as number) * conversionRate * exchangeRate * base,
      ) / base,
    ),
  );
  fiatFixed = isNaN(fiatFixed) ? 0.0 : fiatFixed;
  return fiatFixed;
}

export function getCurrencySymbol(currencyCode: string): string {
  if (currencySymbolsMap[currencyCode]) {
    return `${currencySymbolsMap[currencyCode]}`;
  }
  return currencyCode;
}

/**
 * Formats a fiat value into a string ready to be rendered
 */
export function renderFiat(
  value: number,
  currencyCode: string,
  decimalsToShow: number = 5,
): string {
  const base = Math.pow(10, decimalsToShow);
  let fiatFixed = parseFloat(String(Math.round(value * base) / base));
  fiatFixed = isNaN(fiatFixed) ? 0.0 : fiatFixed;
  if (currencySymbolsMap[currencyCode]) {
    return `${currencySymbolsMap[currencyCode]}${fiatFixed}`;
  }
  return `${fiatFixed} ${currencyCode.toUpperCase()}`;
}

/**
 * Converts BN wei value to wei units in string format
 */
export function renderWei(value: Numeric): string {
  if (!value) return '0';
  const wei = fromWei(value);
  const renderWeiVal = (parseFloat(wei) as number) * Math.pow(10, 18);
  return renderWeiVal.toString();
}

/**
 * Format a string number in an string number with at most 5 decimal places
 */
export function renderNumber(num: string): string {
  const index = num.indexOf('.');
  if (index === 0) return num;
  return num.substring(0, index + 6);
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

interface ConverterParams {
  value?: Numeric;
  fromNumericBase?: string;
  fromDenomination?: string;
  fromCurrency?: string | null;
  toNumericBase?: string;
  toDenomination?: string;
  toCurrency?: string | null;
  numberOfDecimals?: number;
  conversionRate?: number | string | null;
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
}: ConverterParams): string | number | BigNumber | BN4 => {
  let convertedValue: Numeric | undefined = fromNumericBase
    ? toBigNumber[fromNumericBase](value as Numeric)
    : value;

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
    let rate = toBigNumber.dec(conversionRate);
    if (invertConversionRate) {
      rate = new BigNumber(1.0).div(conversionRate);
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
  return convertedValue as string | number | BigNumber | BN4;
};

interface ConversionUtilOptions {
  fromCurrency?: string | null;
  toCurrency?: string | null;
  fromNumericBase?: string;
  toNumericBase?: string;
  fromDenomination?: string;
  toDenomination?: string;
  numberOfDecimals?: number;
  conversionRate?: number | string | null;
  invertConversionRate?: boolean;
}

export const conversionUtil = (
  value: Numeric | null | undefined,
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
): string | number | BigNumber | BN4 =>
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
    value: (value as Numeric) || '0',
  });

/* eslint-disable @typescript-eslint/unified-signatures */
export function toHexadecimal(): undefined;
export function toHexadecimal(decimal: null): null;
export function toHexadecimal(decimal: undefined): undefined;
export function toHexadecimal(decimal: string | number): `0x${string}`;
export function toHexadecimal(
  decimal?: string | number | null,
): `0x${string}` | null | undefined;
/* eslint-enable @typescript-eslint/unified-signatures */
export function toHexadecimal(
  decimal?: string | number | null,
): `0x${string}` | null | undefined {
  if (decimal === null) return null;
  if (decimal === undefined || decimal === '') return decimal as undefined;
  let dec: string = decimal as string;
  if (typeof dec !== 'string') {
    dec = String(dec);
  }
  if (dec.startsWith('0x')) return dec as `0x${string}`;
  return toBigNumber.dec(dec).toString(16) as `0x${string}`;
}

interface CalculateEthFeeForMultiLayerParams {
  multiLayerL1FeeTotal?: string | number | null;
  ethFee?: string | number;
}

export const calculateEthFeeForMultiLayer = ({
  multiLayerL1FeeTotal,
  ethFee = 0,
}: CalculateEthFeeForMultiLayerParams): string | number => {
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

export const isZeroValue = (value: unknown): boolean => {
  if (value === null || value === undefined) {
    return false;
  }
  return (
    value === '0x0' || (isBN(value) && value.isZero()) || isZero(value as string)
  );
};

export const formatValueToMatchTokenDecimals = (
  value: string | null | undefined,
  decimal: number | string | null | undefined,
): string | null | undefined => {
  if (value === null || value === undefined) {
    return value;
  }
  const decimalIndex = value.indexOf('.');
  let result: string = value;
  if (decimalIndex !== -1) {
    const fractionalLength = result.substring(decimalIndex + 1).length;
    if (typeof decimal === 'number' && fractionalLength > decimal) {
      result = parseFloat(result).toFixed(decimal);
    }
  }
  return result;
};

export const safeBNToHex = (
  value: BN4 | BigNumber | null | undefined,
): string | undefined => {
  if (value === null || value === undefined) {
    return undefined;
  }

  return BNToHex(value);
};

interface I18nLike {
  t: ((key: string) => string) | unknown;
}

/**
 * Formats a potentially large number to the nearest unit.
 */
export const localizeLargeNumber = (i18n: I18nLike, num: number): string => {
  const oneTrillion = 1000000000000;
  const oneBillion = 1000000000;
  const oneMillion = 1000000;
  const t = i18n.t as (key: string) => string;

  if (num >= oneTrillion) {
    return `${(num / oneTrillion).toFixed(2)}${t(
      'token.trillion_abbreviation',
    )}`;
  } else if (num >= oneBillion) {
    return `${(num / oneBillion).toFixed(2)}${t(
      'token.billion_abbreviation',
    )}`;
  } else if (num >= oneMillion) {
    return `${(num / oneMillion).toFixed(2)}${t(
      'token.million_abbreviation',
    )}`;
  }
  return num.toFixed(2);
};

export const convertDecimalToPercentage = (decimal: number): string => {
  if (typeof decimal !== 'number' || isNaN(decimal)) {
    throw new Error('Input must be a valid number');
  }
  return (decimal * 100).toFixed(2) + '%';
};
