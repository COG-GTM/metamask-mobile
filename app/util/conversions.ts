/* eslint-disable @typescript-eslint/no-explicit-any */
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
  });
}

export function decimalToHex(decimal: string | number): string {
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
}: Record<string, any>): any {
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
}: Record<string, any>): any {
  return conversionUtil(value, {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
    fromCurrency,
    toCurrency,
    numberOfDecimals,
    fromDenomination: WEI,
    toDenomination,
    conversionRate,
  });
}

export function getWeiHexFromDecimalValue({
  value,
  fromCurrency,
  conversionRate,
  fromDenomination,
  invertConversionRate,
}: Record<string, any>): any {
  return conversionUtil(value, {
    fromNumericBase: 'dec',
    toNumericBase: 'hex',
    toCurrency: ETH,
    fromCurrency,
    conversionRate,
    invertConversionRate,
    fromDenomination,
    toDenomination: WEI,
  });
}

export function addHexWEIsToDec(aHexWEI: string, bHexWEI: string): any {
  return addCurrencies(aHexWEI, bHexWEI, {
    aBase: 16,
    bBase: 16,
    fromDenomination: 'WEI',
    numberOfDecimals: 6,
  });
}

export function subtractHexWEIsToDec(aHexWEI: string, bHexWEI: string): any {
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
  conversionRate: string | number,
): any {
  return conversionUtil(ethTotal, {
    fromNumericBase: 'dec',
    toNumericBase: 'dec',
    fromCurrency: 'ETH',
    toCurrency: convertedCurrency,
    numberOfDecimals: 2,
    conversionRate,
  });
}

export function decGWEIToHexWEI(decGWEI: string | number): any {
  return conversionUtil(decGWEI, {
    fromNumericBase: 'dec',
    toNumericBase: 'hex',
    fromDenomination: 'GWEI',
    toDenomination: 'WEI',
  });
}

export function hexGWEIToHexWEI(decGWEI: string): any {
  return conversionUtil(decGWEI, {
    fromNumericBase: 'hex',
    toNumericBase: 'hex',
    fromDenomination: 'GWEI',
    toDenomination: 'WEI',
  });
}

export function hexWEIToDecGWEI(decGWEI: string): any {
  return conversionUtil(decGWEI, {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
    fromDenomination: 'WEI',
    toDenomination: 'GWEI',
  });
}

export function decETHToDecWEI(decEth: string | number): any {
  return conversionUtil(decEth, {
    fromNumericBase: 'dec',
    toNumericBase: 'dec',
    fromDenomination: 'ETH',
    toDenomination: 'WEI',
  });
}

export function hexWEIToDecETH(hexWEI: string): any {
  return conversionUtil(hexWEI, {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
    fromDenomination: 'WEI',
    toDenomination: 'ETH',
  });
}

export function addHexes(aHexWEI: string, bHexWEI: string): any {
  return addCurrencies(aHexWEI, bHexWEI, {
    aBase: 16,
    bBase: 16,
    toNumericBase: 'hex',
    numberOfDecimals: 6,
  });
}

export function sumHexWEIs(hexWEIs: string[]): any {
  return hexWEIs.filter(Boolean).reduce(addHexes);
}

export function sumHexWEIsToUnformattedFiat(
  hexWEIs: string[],
  convertedCurrency: string,
  conversionRate: string | number,
): any {
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
  conversionRate: string | number,
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
