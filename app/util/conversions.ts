import type BigNumber from 'bignumber.js';
import { hexToBN } from '@metamask/controller-utils';
import { ETH, GWEI, WEI } from './custom-gas';
import {
  conversionUtil as rawConversionUtil,
  addCurrencies as rawAddCurrencies,
  subtractCurrencies as rawSubtractCurrencies,
} from './conversion';
import { formatCurrency } from './confirm-tx.js';
import { addHexPrefix } from './number';

type NumericValue = string | number | BigNumber;
type Currency = string;
type ConversionRate = string | number | BigNumber;
type ConversionResult = string | number | BigNumber;

interface ConversionOptions {
  fromCurrency?: Currency;
  toCurrency?: Currency;
  fromNumericBase?: 'hex' | 'dec' | 'BN';
  toNumericBase?: 'hex' | 'dec' | 'BN';
  fromDenomination?: string;
  toDenomination?: string;
  numberOfDecimals?: number;
  conversionRate?: ConversionRate;
  invertConversionRate?: boolean;
}

interface WeiConversionOptions {
  value: NumericValue;
  fromCurrency?: Currency;
  toCurrency?: Currency;
  conversionRate?: ConversionRate;
  numberOfDecimals?: number;
  toDenomination?: string;
}

const conversionUtil = rawConversionUtil as unknown as (
  value: NumericValue,
  options: ConversionOptions,
) => ConversionResult;
const addCurrencies = rawAddCurrencies as unknown as (
  a: NumericValue,
  b: NumericValue,
  options: ConversionOptions & { aBase: number; bBase: number },
) => ConversionResult;
const subtractCurrencies = rawSubtractCurrencies as unknown as (
  a: NumericValue,
  b: NumericValue,
  options: ConversionOptions & { aBase: number; bBase: number },
) => ConversionResult;

export function hexToDecimal(hexValue: NumericValue) {
  return conversionUtil(hexValue, {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
  });
}

export function decimalToHex(decimal: NumericValue) {
  return conversionUtil(decimal, {
    fromNumericBase: 'dec',
    toNumericBase: 'hex',
  });
}

export function getEthConversionFromWeiHex({
  value,
  fromCurrency = ETH,
  conversionRate,
  numberOfDecimals = 6,
}: WeiConversionOptions): string {
  const denominations = [fromCurrency, GWEI, WEI];

  let nonZeroDenomination = '';

  for (let i = 0; i < denominations.length; i++) {
    const convertedValue = getValueFromWeiHex({
      value,
      conversionRate,
      fromCurrency,
      toCurrency: fromCurrency,
      numberOfDecimals,
      toDenomination: denominations[i],
    });

    if (convertedValue !== '0' || i === denominations.length - 1) {
      nonZeroDenomination = `${convertedValue} ${denominations[i]}`;
      break;
    }
  }

  return nonZeroDenomination;
}

export function getValueFromWeiHex({
  value,
  fromCurrency = ETH,
  toCurrency,
  conversionRate,
  numberOfDecimals,
  toDenomination,
}: WeiConversionOptions) {
  return conversionUtil(value, {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
    fromCurrency,
    toCurrency,
    numberOfDecimals,
    fromDenomination: WEI,
    toDenomination,
    conversionRate,
  }) as string;
}

export function getWeiHexFromDecimalValue({
  value,
  fromCurrency,
  conversionRate,
  fromDenomination,
  invertConversionRate,
}: ConversionOptions & { value: NumericValue }): string {
  return conversionUtil(value, {
    fromNumericBase: 'dec',
    toNumericBase: 'hex',
    toCurrency: ETH,
    fromCurrency,
    conversionRate,
    invertConversionRate,
    fromDenomination,
    toDenomination: WEI,
  }) as string;
}

export function addHexWEIsToDec(
  aHexWEI: NumericValue,
  bHexWEI: NumericValue,
) {
  return addCurrencies(aHexWEI, bHexWEI, {
    aBase: 16,
    bBase: 16,
    fromDenomination: 'WEI',
    numberOfDecimals: 6,
  });
}

export function subtractHexWEIsToDec(
  aHexWEI: NumericValue,
  bHexWEI: NumericValue,
) {
  return subtractCurrencies(aHexWEI, bHexWEI, {
    aBase: 16,
    bBase: 16,
    fromDenomination: 'WEI',
    numberOfDecimals: 6,
  });
}

export function decEthToConvertedCurrency(
  ethTotal: NumericValue,
  convertedCurrency: Currency,
  conversionRate?: ConversionRate,
) {
  return conversionUtil(ethTotal, {
    fromNumericBase: 'dec',
    toNumericBase: 'dec',
    fromCurrency: 'ETH',
    toCurrency: convertedCurrency,
    numberOfDecimals: 2,
    conversionRate,
  });
}

export function decGWEIToHexWEI(decGWEI: NumericValue) {
  return conversionUtil(decGWEI, {
    fromNumericBase: 'dec',
    toNumericBase: 'hex',
    fromDenomination: 'GWEI',
    toDenomination: 'WEI',
  });
}

export function hexGWEIToHexWEI(decGWEI: NumericValue) {
  return conversionUtil(decGWEI, {
    fromNumericBase: 'hex',
    toNumericBase: 'hex',
    fromDenomination: 'GWEI',
    toDenomination: 'WEI',
  });
}

export function hexWEIToDecGWEI(decGWEI: NumericValue) {
  return conversionUtil(decGWEI, {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
    fromDenomination: 'WEI',
    toDenomination: 'GWEI',
  });
}

export function decETHToDecWEI(decEth: NumericValue) {
  return conversionUtil(decEth, {
    fromNumericBase: 'dec',
    toNumericBase: 'dec',
    fromDenomination: 'ETH',
    toDenomination: 'WEI',
  });
}

export function hexWEIToDecETH(hexWEI: NumericValue) {
  return conversionUtil(hexWEI, {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
    fromDenomination: 'WEI',
    toDenomination: 'ETH',
  });
}

export function addHexes(
  aHexWEI: NumericValue,
  bHexWEI: NumericValue,
) {
  return addCurrencies(aHexWEI, bHexWEI, {
    aBase: 16,
    bBase: 16,
    toNumericBase: 'hex',
    numberOfDecimals: 6,
  });
}

export function sumHexWEIs(hexWEIs: NumericValue[]) {
  return hexWEIs.filter(Boolean).reduce(addHexes);
}

export function sumHexWEIsToUnformattedFiat(
  hexWEIs: NumericValue[],
  convertedCurrency: Currency,
  conversionRate?: ConversionRate,
) {
  const hexWEIsSum = sumHexWEIs(hexWEIs);
  const convertedTotal = decEthToConvertedCurrency(
    getValueFromWeiHex({
      value: hexWEIsSum,
      toCurrency: 'ETH',
      numberOfDecimals: 4,
    }),
    convertedCurrency,
    conversionRate,
  );
  return convertedTotal;
}

export function sumHexWEIsToRenderableFiat(
  hexWEIs: NumericValue[],
  convertedCurrency: Currency,
  conversionRate?: ConversionRate,
) {
  const convertedTotal = sumHexWEIsToUnformattedFiat(
    hexWEIs,
    convertedCurrency,
    conversionRate,
  );
  return formatCurrency(convertedTotal, convertedCurrency);
}

export function formatETHFee(
  ethFee: NumericValue,
  currencySymbol = 'ETH',
  showLessThan?: boolean,
): string {
  if (showLessThan && ethFee === '0') return `< 0.000001 ${currencySymbol}`;
  return `${ethFee} ${currencySymbol}`;
}

export function sumHexWEIsToRenderableEth(hexWEIs: NumericValue[]) {
  const hexWEIsSum = hexWEIs.filter(Boolean).reduce(addHexes);
  return formatETHFee(
    getValueFromWeiHex({
      value: hexWEIsSum,
      toCurrency: 'ETH',
      numberOfDecimals: 6,
    }),
  );
}

export function multiplyHexes(hex1: string, hex2: string): string {
  return hexToBN(hex1).mul(hexToBN(hex2)).toString(16);
}

export function decimalToPrefixedHex(decimal: NumericValue): string {
  return addHexPrefix(decimalToHex(decimal) as string);
}
