import { hexToBN } from '@metamask/controller-utils';
import { ETH, GWEI, WEI } from './custom-gas';
import {
  conversionUtil,
  addCurrencies,
  subtractCurrencies,
} from './conversion';
import { formatCurrency } from './confirm-tx';
import { addHexPrefix } from './number';

export function hexToDecimal(hexValue: string): string {
  return conversionUtil(hexValue, {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
  } as Parameters<typeof conversionUtil>[1]) as string;
}

export function decimalToHex(decimal: string | number): string {
  return conversionUtil(decimal, {
    fromNumericBase: 'dec',
    toNumericBase: 'hex',
  } as Parameters<typeof conversionUtil>[1]) as string;
}

export function getEthConversionFromWeiHex({
  value,
  fromCurrency = ETH,
  conversionRate,
  numberOfDecimals = 6,
}: {
  value: string;
  fromCurrency?: string;
  conversionRate?: number;
  numberOfDecimals?: number;
}) {
  const denominations = [fromCurrency, GWEI, WEI];

  let nonZeroDenomination;

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
}: {
  value: string;
  fromCurrency?: string;
  toCurrency?: string;
  conversionRate?: number | { toNumber?: () => number };
  numberOfDecimals?: number;
  toDenomination?: string;
}): string {
  return conversionUtil(value, {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
    fromCurrency,
    toCurrency,
    numberOfDecimals,
    fromDenomination: WEI,
    toDenomination,
    conversionRate,
  } as Parameters<typeof conversionUtil>[1]) as string;
}

export function getWeiHexFromDecimalValue({
  value,
  fromCurrency,
  conversionRate,
  fromDenomination,
  invertConversionRate,
}: {
  value: string;
  fromCurrency: string;
  conversionRate?: number;
  fromDenomination?: string;
  invertConversionRate?: boolean;
}): string {
  return conversionUtil(value, {
    fromNumericBase: 'dec',
    toNumericBase: 'hex',
    toCurrency: ETH,
    fromCurrency,
    conversionRate,
    invertConversionRate,
    fromDenomination,
    toDenomination: WEI,
  } as Parameters<typeof conversionUtil>[1]) as string;
}

export function addHexWEIsToDec(aHexWEI: string, bHexWEI: string) {
  return addCurrencies(aHexWEI, bHexWEI, {
    aBase: 16,
    bBase: 16,
    fromDenomination: 'WEI',
    numberOfDecimals: 6,
  }) as string;
}

export function subtractHexWEIsToDec(aHexWEI: string, bHexWEI: string) {
  return subtractCurrencies(aHexWEI, bHexWEI, {
    aBase: 16,
    bBase: 16,
    fromDenomination: 'WEI',
    numberOfDecimals: 6,
  }) as string;
}

export function decEthToConvertedCurrency(
  ethTotal: string,
  convertedCurrency: string,
  conversionRate: number,
): string {
  return conversionUtil(ethTotal, {
    fromNumericBase: 'dec',
    toNumericBase: 'dec',
    fromCurrency: 'ETH',
    toCurrency: convertedCurrency,
    numberOfDecimals: 2,
    conversionRate,
  } as Parameters<typeof conversionUtil>[1]) as string;
}

export function decGWEIToHexWEI(decGWEI: string | number): string {
  return conversionUtil(decGWEI, {
    fromNumericBase: 'dec',
    toNumericBase: 'hex',
    fromDenomination: 'GWEI',
    toDenomination: 'WEI',
  } as Parameters<typeof conversionUtil>[1]) as string;
}

export function hexGWEIToHexWEI(decGWEI: string): string {
  return conversionUtil(decGWEI, {
    fromNumericBase: 'hex',
    toNumericBase: 'hex',
    fromDenomination: 'GWEI',
    toDenomination: 'WEI',
  } as Parameters<typeof conversionUtil>[1]) as string;
}

export function hexWEIToDecGWEI(decGWEI: string | number): string {
  return conversionUtil(decGWEI, {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
    fromDenomination: 'WEI',
    toDenomination: 'GWEI',
  } as Parameters<typeof conversionUtil>[1]) as string;
}

export function decETHToDecWEI(decEth: string): string {
  return conversionUtil(decEth, {
    fromNumericBase: 'dec',
    toNumericBase: 'dec',
    fromDenomination: 'ETH',
    toDenomination: 'WEI',
  } as Parameters<typeof conversionUtil>[1]) as string;
}

export function hexWEIToDecETH(hexWEI: string): string {
  return conversionUtil(hexWEI, {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
    fromDenomination: 'WEI',
    toDenomination: 'ETH',
  } as Parameters<typeof conversionUtil>[1]) as string;
}

export function addHexes(aHexWEI: string, bHexWEI: string): string {
  return addCurrencies(aHexWEI, bHexWEI, {
    aBase: 16,
    bBase: 16,
    toNumericBase: 'hex',
    numberOfDecimals: 6,
  }) as string;
}

export function sumHexWEIs(hexWEIs: string[]) {
  return hexWEIs.filter(Boolean).reduce(addHexes);
}

export function sumHexWEIsToUnformattedFiat(
  hexWEIs: string[],
  convertedCurrency: string,
  conversionRate: number,
) {
  const hexWEIsSum = sumHexWEIs(hexWEIs);
  const convertedTotal = decEthToConvertedCurrency(
    getValueFromWeiHex({
      value: hexWEIsSum,
      toCurrency: 'ETH',
      numberOfDecimals: 4,
    }) as string,
    convertedCurrency,
    conversionRate,
  );
  return convertedTotal;
}

export function sumHexWEIsToRenderableFiat(
  hexWEIs: string[],
  convertedCurrency: string,
  conversionRate: number,
) {
  const convertedTotal = sumHexWEIsToUnformattedFiat(
    hexWEIs,
    convertedCurrency,
    conversionRate,
  );
  return formatCurrency(convertedTotal as string, convertedCurrency);
}

export function formatETHFee(ethFee: string, currencySymbol = 'ETH', showLessThan?: boolean) {
  if (showLessThan && ethFee === '0') return `< 0.000001 ${currencySymbol}`;
  return `${ethFee} ${currencySymbol}`;
}

export function sumHexWEIsToRenderableEth(hexWEIs: string[]) {
  const hexWEIsSum = hexWEIs.filter(Boolean).reduce(addHexes);
  return formatETHFee(
    getValueFromWeiHex({
      value: hexWEIsSum,
      toCurrency: 'ETH',
      numberOfDecimals: 6,
    }) as string,
  );
}

export function multiplyHexes(hex1: string, hex2: string): string {
  return hexToBN(hex1).mul(hexToBN(hex2)).toString(16);
}

export function decimalToPrefixedHex(decimal: string | number): string {
  return addHexPrefix(decimalToHex(decimal) as string);
}
