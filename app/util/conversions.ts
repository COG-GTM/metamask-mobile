import { hexToBN } from '@metamask/controller-utils';
import { ETH, GWEI, WEI } from './custom-gas';
import {
  formatCurrency,
  conversionUtil,
  addCurrencies,
  subtractCurrencies,
  conversionResultToString,
  conversionResultToPrimitive,
  type ConversionRate,
  type ConversionResult,
} from './confirm-tx';
import { addHexPrefix } from './number';

export function hexToDecimal(hexValue: string | number): string {
  return conversionResultToString(
    conversionUtil(hexValue, {
      fromNumericBase: 'hex',
      toNumericBase: 'dec',
    }),
  );
}

export function decimalToHex(decimal: string | number): string {
  return conversionResultToString(
    conversionUtil(decimal, {
      fromNumericBase: 'dec',
      toNumericBase: 'hex',
    }),
  );
}

export interface EthConversionFromWeiHexParams {
  value: string;
  fromCurrency?: string;
  conversionRate?: ConversionRate;
  numberOfDecimals?: number;
}

export function getEthConversionFromWeiHex({
  value,
  fromCurrency = ETH,
  conversionRate,
  numberOfDecimals = 6,
}: EthConversionFromWeiHexParams): string | undefined {
  const denominations = [fromCurrency, GWEI, WEI];

  let nonZeroDenomination: string | undefined;

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

export interface ValueFromWeiHexParams {
  value: string;
  fromCurrency?: string;
  toCurrency?: string;
  conversionRate?: ConversionRate;
  numberOfDecimals?: number;
  toDenomination?: string;
}

export function getValueFromWeiHex({
  value,
  fromCurrency = ETH,
  toCurrency,
  conversionRate,
  numberOfDecimals,
  toDenomination,
}: ValueFromWeiHexParams): string | number {
  return conversionResultToPrimitive(
    conversionUtil(value, {
      fromNumericBase: 'hex',
      toNumericBase: 'dec',
      fromCurrency,
      toCurrency,
      numberOfDecimals,
      fromDenomination: WEI,
      toDenomination,
      conversionRate,
    }),
  );
}

export interface WeiHexFromDecimalValueParams {
  value: string | number;
  fromCurrency?: string;
  conversionRate?: ConversionRate;
  fromDenomination?: string;
  invertConversionRate?: boolean;
}

export function getWeiHexFromDecimalValue({
  value,
  fromCurrency,
  conversionRate,
  fromDenomination,
  invertConversionRate,
}: WeiHexFromDecimalValueParams): string | number {
  return conversionResultToPrimitive(
    conversionUtil(value, {
      fromNumericBase: 'dec',
      toNumericBase: 'hex',
      toCurrency: ETH,
      fromCurrency,
      conversionRate,
      invertConversionRate,
      fromDenomination,
      toDenomination: WEI,
    }),
  );
}

export function addHexWEIsToDec(
  aHexWEI: string,
  bHexWEI: string,
): ConversionResult {
  return addCurrencies(aHexWEI, bHexWEI, {
    aBase: 16,
    bBase: 16,
    fromDenomination: 'WEI',
    numberOfDecimals: 6,
  });
}

export function subtractHexWEIsToDec(
  aHexWEI: string,
  bHexWEI: string,
): ConversionResult {
  return subtractCurrencies(aHexWEI, bHexWEI, {
    aBase: 16,
    bBase: 16,
    fromDenomination: 'WEI',
    numberOfDecimals: 6,
  });
}

export function decEthToConvertedCurrency(
  ethTotal: string | number,
  convertedCurrency: string,
  conversionRate?: ConversionRate,
): string | number {
  return conversionResultToPrimitive(
    conversionUtil(ethTotal, {
      fromNumericBase: 'dec',
      toNumericBase: 'dec',
      fromCurrency: 'ETH',
      toCurrency: convertedCurrency,
      numberOfDecimals: 2,
      conversionRate,
    }),
  );
}

export function decGWEIToHexWEI(decGWEI: string | number): string {
  return conversionResultToString(
    conversionUtil(decGWEI, {
      fromNumericBase: 'dec',
      toNumericBase: 'hex',
      fromDenomination: 'GWEI',
      toDenomination: 'WEI',
    }),
  );
}

export function hexGWEIToHexWEI(decGWEI: string): string {
  return conversionResultToString(
    conversionUtil(decGWEI, {
      fromNumericBase: 'hex',
      toNumericBase: 'hex',
      fromDenomination: 'GWEI',
      toDenomination: 'WEI',
    }),
  );
}

export function hexWEIToDecGWEI(decGWEI: string): string {
  return conversionResultToString(
    conversionUtil(decGWEI, {
      fromNumericBase: 'hex',
      toNumericBase: 'dec',
      fromDenomination: 'WEI',
      toDenomination: 'GWEI',
    }),
  );
}

export function decETHToDecWEI(decEth: string | number): string {
  return conversionResultToString(
    conversionUtil(decEth, {
      fromNumericBase: 'dec',
      toNumericBase: 'dec',
      fromDenomination: 'ETH',
      toDenomination: 'WEI',
    }),
  );
}

export function hexWEIToDecETH(hexWEI: string): string {
  return conversionResultToString(
    conversionUtil(hexWEI, {
      fromNumericBase: 'hex',
      toNumericBase: 'dec',
      fromDenomination: 'WEI',
      toDenomination: 'ETH',
    }),
  );
}

export function addHexes(aHexWEI: string, bHexWEI: string): string {
  return conversionResultToString(
    addCurrencies(aHexWEI, bHexWEI, {
      aBase: 16,
      bBase: 16,
      toNumericBase: 'hex',
      numberOfDecimals: 6,
    }),
  );
}

type MaybeHex = string | null | undefined | false | 0;

export function sumHexWEIs(hexWEIs: MaybeHex[]): string {
  return hexWEIs.filter((hex): hex is string => Boolean(hex)).reduce(addHexes);
}

export function sumHexWEIsToUnformattedFiat(
  hexWEIs: MaybeHex[],
  convertedCurrency: string,
  conversionRate?: ConversionRate,
): string | number {
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
  hexWEIs: MaybeHex[],
  convertedCurrency: string,
  conversionRate?: ConversionRate,
): string {
  const convertedTotal = sumHexWEIsToUnformattedFiat(
    hexWEIs,
    convertedCurrency,
    conversionRate,
  );
  return formatCurrency(convertedTotal, convertedCurrency);
}

export function formatETHFee(
  ethFee: string | number,
  currencySymbol = 'ETH',
  showLessThan?: boolean,
): string {
  if (showLessThan && ethFee === '0') return `< 0.000001 ${currencySymbol}`;
  return `${ethFee} ${currencySymbol}`;
}

export function sumHexWEIsToRenderableEth(hexWEIs: MaybeHex[]): string {
  const hexWEIsSum = hexWEIs
    .filter((hex): hex is string => Boolean(hex))
    .reduce(addHexes);
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
