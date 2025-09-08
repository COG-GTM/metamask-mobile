import { hexToBN } from '@metamask/controller-utils';
import { ETH, GWEI, WEI } from './custom-gas';
import {
  conversionUtil,
  addCurrencies,
  subtractCurrencies,
} from './conversion';
import { formatCurrency } from './confirm-tx.js';
import { addHexPrefix } from './number';
import { BigNumber } from 'bignumber.js';

interface ConversionOptions {
  value: string;
  fromCurrency?: string;
  toCurrency?: string;
  conversionRate?: number | BigNumber;
  numberOfDecimals?: number;
  toDenomination?: string;
}

interface WeiHexConversionOptions {
  value: string;
  fromCurrency?: string;
  conversionRate?: number;
  fromDenomination?: string;
  invertConversionRate?: boolean;
}

export function hexToDecimal(hexValue: string): string {
  return conversionUtil(hexValue, {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
    fromCurrency: undefined,
    toCurrency: undefined,
    fromDenomination: undefined,
    toDenomination: undefined,
    numberOfDecimals: undefined,
    conversionRate: undefined,
    invertConversionRate: undefined,
  }) as string;
}

export function decimalToHex(decimal: string | number): string {
  return conversionUtil(decimal, {
    fromNumericBase: 'dec',
    toNumericBase: 'hex',
    fromCurrency: undefined,
    toCurrency: undefined,
    fromDenomination: undefined,
    toDenomination: undefined,
    numberOfDecimals: undefined,
    conversionRate: undefined,
    invertConversionRate: undefined,
  }) as string;
}

export function getEthConversionFromWeiHex({
  value,
  fromCurrency = ETH,
  conversionRate,
  numberOfDecimals = 6,
}: ConversionOptions): string {
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
}: ConversionOptions): string {
  return conversionUtil(value, {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
    fromCurrency: fromCurrency ? undefined : undefined,
    toCurrency: toCurrency ? undefined : undefined,
    numberOfDecimals,
    fromDenomination: WEI,
    toDenomination,
    conversionRate,
    invertConversionRate: undefined,
  }) as string;
}

export function getWeiHexFromDecimalValue({
  value,
  fromCurrency,
  conversionRate,
  fromDenomination,
  invertConversionRate,
}: WeiHexConversionOptions): string {
  return conversionUtil(value, {
    fromNumericBase: 'dec',
    toNumericBase: 'hex',
    toCurrency: undefined,
    fromCurrency: fromCurrency ? undefined : undefined,
    conversionRate,
    invertConversionRate,
    fromDenomination,
    toDenomination: WEI,
    numberOfDecimals: undefined,
  }) as string;
}

export function addHexWEIsToDec(aHexWEI: string, bHexWEI: string): string {
  return addCurrencies(aHexWEI, bHexWEI, {
    aBase: 16,
    bBase: 16,
    fromDenomination: 'WEI',
    numberOfDecimals: 6,
  }) as string;
}

export function subtractHexWEIsToDec(aHexWEI: string, bHexWEI: string): string {
  return subtractCurrencies(aHexWEI, bHexWEI, {
    aBase: 16,
    bBase: 16,
    fromDenomination: 'WEI',
    numberOfDecimals: 6,
  }) as string;
}

export function decEthToConvertedCurrency(
  ethTotal: string,
  _convertedCurrency: string,
  conversionRate: number | BigNumber,
): string {
  return conversionUtil(ethTotal, {
    fromNumericBase: 'dec',
    toNumericBase: 'dec',
    fromCurrency: undefined,
    toCurrency: undefined,
    numberOfDecimals: 2,
    conversionRate,
    fromDenomination: undefined,
    toDenomination: undefined,
    invertConversionRate: undefined,
  }) as string;
}

export function decGWEIToHexWEI(decGWEI: string | number): string {
  return conversionUtil(decGWEI, {
    fromNumericBase: 'dec',
    toNumericBase: 'hex',
    fromDenomination: 'GWEI',
    toDenomination: 'WEI',
    fromCurrency: undefined,
    toCurrency: undefined,
    numberOfDecimals: undefined,
    conversionRate: undefined,
    invertConversionRate: undefined,
  }) as string;
}

export function hexGWEIToHexWEI(decGWEI: string | number): string {
  return conversionUtil(decGWEI, {
    fromNumericBase: 'hex',
    toNumericBase: 'hex',
    fromDenomination: 'GWEI',
    toDenomination: 'WEI',
    fromCurrency: undefined,
    toCurrency: undefined,
    numberOfDecimals: undefined,
    conversionRate: undefined,
    invertConversionRate: undefined,
  }) as string;
}

export function hexWEIToDecGWEI(decGWEI: string | number): string {
  return conversionUtil(decGWEI, {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
    fromDenomination: 'WEI',
    toDenomination: 'GWEI',
    fromCurrency: undefined,
    toCurrency: undefined,
    numberOfDecimals: undefined,
    conversionRate: undefined,
    invertConversionRate: undefined,
  }) as string;
}

export function decETHToDecWEI(decEth: string): string {
  return conversionUtil(decEth, {
    fromNumericBase: 'dec',
    toNumericBase: 'dec',
    fromDenomination: 'ETH',
    toDenomination: 'WEI',
    fromCurrency: undefined,
    toCurrency: undefined,
    numberOfDecimals: undefined,
    conversionRate: undefined,
    invertConversionRate: undefined,
  }) as string;
}

export function hexWEIToDecETH(hexWEI: string): string {
  return conversionUtil(hexWEI, {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
    fromDenomination: 'WEI',
    toDenomination: 'ETH',
    fromCurrency: undefined,
    toCurrency: undefined,
    numberOfDecimals: undefined,
    conversionRate: undefined,
    invertConversionRate: undefined,
  }) as string;
}

export function addHexes(aHexWEI: string, bHexWEI: string): string {
  return addCurrencies(aHexWEI, bHexWEI, {
    aBase: 16,
    bBase: 16,
    toNumericBase: 'hex',
    numberOfDecimals: 6,
  }) as string;
}

export function sumHexWEIs(hexWEIs: string[]): string {
  return hexWEIs.filter(Boolean).reduce(addHexes);
}

export function sumHexWEIsToUnformattedFiat(
  hexWEIs: string[],
  convertedCurrency: string,
  conversionRate: number,
): string {
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
  hexWEIs: string[],
  convertedCurrency: string,
  conversionRate: number,
): string {
  const convertedTotal = sumHexWEIsToUnformattedFiat(
    hexWEIs,
    convertedCurrency,
    conversionRate,
  );
  return formatCurrency(convertedTotal, convertedCurrency);
}

export function formatETHFee(ethFee: string, currencySymbol = 'ETH', showLessThan?: boolean): string {
  if (showLessThan && ethFee === '0') return `< 0.000001 ${currencySymbol}`;
  return `${ethFee} ${currencySymbol}`;
}

export function sumHexWEIsToRenderableEth(hexWEIs: string[]): string {
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

export function decimalToPrefixedHex(decimal: string | number): string {
  return addHexPrefix(decimalToHex(decimal));
}
