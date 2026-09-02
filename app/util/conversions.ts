import { hexToBN } from '@metamask/controller-utils';
import BigNumber from 'bignumber.js';
import { ETH, GWEI, WEI } from './custom-gas';
import {
  conversionUtil,
  addCurrencies,
  subtractCurrencies,
  type ConversionInput,
  type EthDenomination,
} from './conversion';
import { formatCurrency } from './confirm-tx.js';
import { addHexPrefix } from './number';

export function hexToDecimal(hexValue: ConversionInput): string | 0 {
  return conversionUtil(hexValue, {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
  });
}

export function decimalToHex(decimal: ConversionInput): string | 0 {
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
}: {
  value: ConversionInput;
  fromCurrency?: string;
  conversionRate?: number | string;
  numberOfDecimals?: number;
}): string | undefined {
  const denominations: string[] = [fromCurrency, GWEI, WEI];

  let nonZeroDenomination: string | undefined;

  for (let i = 0; i < denominations.length; i++) {
    const convertedValue = getValueFromWeiHex({
      value,
      conversionRate,
      fromCurrency,
      toCurrency: fromCurrency,
      numberOfDecimals,
      toDenomination: denominations[i] as EthDenomination,
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
  value: ConversionInput;
  fromCurrency?: string;
  toCurrency?: string;
  conversionRate?: number | string;
  numberOfDecimals?: number;
  toDenomination?: EthDenomination;
}): string | 0 {
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
}: {
  value: ConversionInput;
  fromCurrency?: string;
  conversionRate?: number | string;
  fromDenomination?: EthDenomination;
  invertConversionRate?: boolean;
}): string | 0 {
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

export function addHexWEIsToDec(
  aHexWEI: ConversionInput,
  bHexWEI: ConversionInput,
): BigNumber {
  return addCurrencies(aHexWEI, bHexWEI, {
    aBase: 16,
    bBase: 16,
    fromDenomination: 'WEI',
    numberOfDecimals: 6,
  });
}

export function subtractHexWEIsToDec(
  aHexWEI: ConversionInput,
  bHexWEI: ConversionInput,
): BigNumber {
  return subtractCurrencies(aHexWEI, bHexWEI, {
    aBase: 16,
    bBase: 16,
    fromDenomination: 'WEI',
    numberOfDecimals: 6,
  });
}

export function decEthToConvertedCurrency(
  ethTotal: ConversionInput,
  convertedCurrency: string,
  conversionRate?: number | string,
): string | 0 {
  return conversionUtil(ethTotal, {
    fromNumericBase: 'dec',
    toNumericBase: 'dec',
    fromCurrency: 'ETH',
    toCurrency: convertedCurrency,
    numberOfDecimals: 2,
    conversionRate,
  });
}

export function decGWEIToHexWEI(decGWEI: ConversionInput): string | 0 {
  return conversionUtil(decGWEI, {
    fromNumericBase: 'dec',
    toNumericBase: 'hex',
    fromDenomination: 'GWEI',
    toDenomination: 'WEI',
  });
}

export function hexGWEIToHexWEI(decGWEI: ConversionInput): string | 0 {
  return conversionUtil(decGWEI, {
    fromNumericBase: 'hex',
    toNumericBase: 'hex',
    fromDenomination: 'GWEI',
    toDenomination: 'WEI',
  });
}

export function hexWEIToDecGWEI(decGWEI: ConversionInput): string | 0 {
  return conversionUtil(decGWEI, {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
    fromDenomination: 'WEI',
    toDenomination: 'GWEI',
  });
}

export function decETHToDecWEI(decEth: ConversionInput): string | 0 {
  return conversionUtil(decEth, {
    fromNumericBase: 'dec',
    toNumericBase: 'dec',
    fromDenomination: 'ETH',
    toDenomination: 'WEI',
  });
}

export function hexWEIToDecETH(hexWEI: ConversionInput): string | 0 {
  return conversionUtil(hexWEI, {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
    fromDenomination: 'WEI',
    toDenomination: 'ETH',
  });
}

export function addHexes(
  aHexWEI: ConversionInput,
  bHexWEI: ConversionInput,
): string {
  return addCurrencies(aHexWEI, bHexWEI, {
    aBase: 16,
    bBase: 16,
    toNumericBase: 'hex',
    numberOfDecimals: 6,
  });
}

export function sumHexWEIs(hexWEIs: (string | null | undefined)[]): string {
  return hexWEIs.filter((hex): hex is string => Boolean(hex)).reduce(addHexes);
}

export function sumHexWEIsToUnformattedFiat(
  hexWEIs: (string | null | undefined)[],
  convertedCurrency: string,
  conversionRate?: number | string,
): string | 0 {
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
  hexWEIs: (string | null | undefined)[],
  convertedCurrency: string,
  conversionRate?: number | string,
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

export function sumHexWEIsToRenderableEth(
  hexWEIs: (string | null | undefined)[],
): string {
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

export function decimalToPrefixedHex(decimal: ConversionInput): string {
  return addHexPrefix(String(decimalToHex(decimal)));
}
