import { hexToBN } from '@metamask/controller-utils';
import BigNumber from 'bignumber.js';
import { ETH, GWEI, WEI } from './custom-gas';
import {
  conversionUtil,
  addCurrencies,
  subtractCurrencies,
} from './conversion';
import { formatCurrency } from './confirm-tx';
import { addHexPrefix } from './number';

export function hexToDecimal(hexValue: string): string {
  return String(
    conversionUtil(hexValue, {
      fromNumericBase: 'hex',
      toNumericBase: 'dec',
    }),
  );
}

export function decimalToHex(decimal: string | number): string {
  return String(
    conversionUtil(decimal, {
      fromNumericBase: 'dec',
      toNumericBase: 'hex',
    }),
  );
}

interface EthConversionParams {
  value: string;
  fromCurrency?: string;
  conversionRate?: number;
  numberOfDecimals?: number;
}

export function getEthConversionFromWeiHex({
  value,
  fromCurrency = ETH,
  conversionRate,
  numberOfDecimals = 6,
}: EthConversionParams): string | undefined {
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

interface ValueFromWeiHexParams {
  value: string;
  fromCurrency?: string;
  toCurrency?: string;
  conversionRate?: number | BigNumber;
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
}: ValueFromWeiHexParams): string {
  return String(
    conversionUtil(value, {
      fromNumericBase: 'hex',
      toNumericBase: 'dec',
      fromCurrency,
      toCurrency,
      numberOfDecimals,
      fromDenomination: WEI,
      toDenomination,
      conversionRate: conversionRate as number,
    }),
  );
}

interface WeiHexFromDecimalParams {
  value: string | number;
  fromCurrency?: string;
  conversionRate?: number;
  fromDenomination?: string;
  invertConversionRate?: boolean;
}

export function getWeiHexFromDecimalValue({
  value,
  fromCurrency,
  conversionRate,
  fromDenomination,
  invertConversionRate,
}: WeiHexFromDecimalParams) {
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

export function addHexWEIsToDec(aHexWEI: string, bHexWEI: string) {
  return addCurrencies(aHexWEI, bHexWEI, {
    aBase: 16,
    bBase: 16,
    fromDenomination: 'WEI',
    numberOfDecimals: 6,
  });
}

export function subtractHexWEIsToDec(aHexWEI: string, bHexWEI: string) {
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
  conversionRate: number,
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

export function decGWEIToHexWEI(decGWEI: string | number): string {
  return conversionUtil(decGWEI, {
    fromNumericBase: 'dec',
    toNumericBase: 'hex',
    fromDenomination: 'GWEI',
    toDenomination: 'WEI',
  }) as string;
}

export function hexGWEIToHexWEI(decGWEI: string): string {
  return conversionUtil(decGWEI, {
    fromNumericBase: 'hex',
    toNumericBase: 'hex',
    fromDenomination: 'GWEI',
    toDenomination: 'WEI',
  }) as string;
}

export function hexWEIToDecGWEI(decGWEI: string) {
  return conversionUtil(decGWEI, {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
    fromDenomination: 'WEI',
    toDenomination: 'GWEI',
  });
}

export function decETHToDecWEI(decEth: string | number) {
  return conversionUtil(decEth, {
    fromNumericBase: 'dec',
    toNumericBase: 'dec',
    fromDenomination: 'ETH',
    toDenomination: 'WEI',
  });
}

export function hexWEIToDecETH(hexWEI: string) {
  return conversionUtil(hexWEI, {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
    fromDenomination: 'WEI',
    toDenomination: 'ETH',
  });
}

export function addHexes(aHexWEI: string, bHexWEI: string): string {
  return addCurrencies(aHexWEI, bHexWEI, {
    aBase: 16,
    bBase: 16,
    toNumericBase: 'hex',
    numberOfDecimals: 6,
  }) as string;
}

export function sumHexWEIs(hexWEIs: (string | undefined | null)[]): string {
  return hexWEIs
    .filter(Boolean)
    .reduce((a, b) => addHexes(a as string, b as string)) as string;
}

export function sumHexWEIsToUnformattedFiat(
  hexWEIs: (string | undefined | null)[],
  convertedCurrency: string,
  conversionRate: number,
) {
  const hexWEIsSum = sumHexWEIs(hexWEIs);
  const convertedTotal = decEthToConvertedCurrency(
    getValueFromWeiHex({
      value: hexWEIsSum as string,
      toCurrency: 'ETH',
      numberOfDecimals: 4,
    }) as string,
    convertedCurrency,
    conversionRate,
  );
  return convertedTotal;
}

export function sumHexWEIsToRenderableFiat(
  hexWEIs: (string | undefined | null)[],
  convertedCurrency: string,
  conversionRate: number,
) {
  const convertedTotal = sumHexWEIsToUnformattedFiat(
    hexWEIs,
    convertedCurrency,
    conversionRate,
  );
  return formatCurrency(convertedTotal as string | number, convertedCurrency);
}

export function formatETHFee(
  ethFee: string | number,
  currencySymbol = 'ETH',
  showLessThan?: boolean,
): string {
  if (showLessThan && ethFee === '0') return `< 0.000001 ${currencySymbol}`;
  return `${ethFee} ${currencySymbol}`;
}

export function sumHexWEIsToRenderableEth(hexWEIs: (string | undefined | null)[]) {
  const hexWEIsSum = hexWEIs
    .filter(Boolean)
    .reduce((a, b) => addHexes(a as string, b as string));
  return formatETHFee(
    getValueFromWeiHex({
      value: hexWEIsSum as string,
      toCurrency: 'ETH',
      numberOfDecimals: 6,
    }) as string,
  );
}

export function multiplyHexes(hex1: string, hex2: string): string {
  return (hexToBN(hex1) as unknown as { mul: (other: unknown) => { toString: (radix: number) => string } })
    .mul(hexToBN(hex2))
    .toString(16);
}

export function decimalToPrefixedHex(decimal: string | number): string {
  return addHexPrefix(decimalToHex(decimal) as string);
}
