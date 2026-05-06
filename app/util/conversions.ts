import { hexToBN } from '@metamask/controller-utils';
import { ETH, GWEI, WEI } from './custom-gas';
import {
  conversionUtil,
  addCurrencies,
  subtractCurrencies,
} from './conversion';
import { formatCurrency } from './confirm-tx';
import { addHexPrefix } from './number';

type NumericInput = string | number;

export function hexToDecimal(hexValue: NumericInput): string {
  return conversionUtil(hexValue, {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
  }) as string;
}

export function decimalToHex(decimal: NumericInput): string {
  return conversionUtil(decimal, {
    fromNumericBase: 'dec',
    toNumericBase: 'hex',
  }) as string;
}

interface GetEthConversionFromWeiHexOptions {
  value: NumericInput;
  fromCurrency?: string;
  conversionRate?: number;
  numberOfDecimals?: number;
}

export function getEthConversionFromWeiHex({
  value,
  fromCurrency = ETH,
  conversionRate,
  numberOfDecimals = 6,
}: GetEthConversionFromWeiHexOptions): string | undefined {
  const denominations = [fromCurrency, GWEI, WEI];

  let nonZeroDenomination: string | undefined;

  for (let i = 0; i < denominations.length; i++) {
    const convertedValue = getValueFromWeiHex({
      value,
      conversionRate,
      fromCurrency,
      toCurrency: fromCurrency,
      numberOfDecimals,
      toDenomination: denominations[i] as 'WEI' | 'GWEI' | 'ETH',
    });

    if (convertedValue !== '0' || i === denominations.length - 1) {
      nonZeroDenomination = `${convertedValue} ${denominations[i]}`;
      break;
    }
  }

  return nonZeroDenomination;
}

interface GetValueFromWeiHexOptions {
  value: NumericInput;
  fromCurrency?: string;
  toCurrency?: string;
  conversionRate?: number;
  numberOfDecimals?: number;
  toDenomination?: 'WEI' | 'GWEI' | 'ETH';
}

export function getValueFromWeiHex({
  value,
  fromCurrency = ETH,
  toCurrency,
  conversionRate,
  numberOfDecimals,
  toDenomination,
}: GetValueFromWeiHexOptions): string {
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

interface GetWeiHexFromDecimalValueOptions {
  value: NumericInput;
  fromCurrency?: string;
  conversionRate?: number;
  fromDenomination?: 'WEI' | 'GWEI' | 'ETH';
  invertConversionRate?: boolean;
}

export function getWeiHexFromDecimalValue({
  value,
  fromCurrency,
  conversionRate,
  fromDenomination,
  invertConversionRate,
}: GetWeiHexFromDecimalValueOptions): string {
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
  aHexWEI: NumericInput,
  bHexWEI: NumericInput,
): string {
  return addCurrencies(aHexWEI, bHexWEI, {
    aBase: 16,
    bBase: 16,
    fromDenomination: 'WEI',
    numberOfDecimals: 6,
  }) as string;
}

export function subtractHexWEIsToDec(
  aHexWEI: NumericInput,
  bHexWEI: NumericInput,
): string {
  return subtractCurrencies(aHexWEI, bHexWEI, {
    aBase: 16,
    bBase: 16,
    fromDenomination: 'WEI',
    numberOfDecimals: 6,
  }) as string;
}

export function decEthToConvertedCurrency(
  ethTotal: NumericInput,
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
  }) as string;
}

export function decGWEIToHexWEI(decGWEI: NumericInput): string {
  return conversionUtil(decGWEI, {
    fromNumericBase: 'dec',
    toNumericBase: 'hex',
    fromDenomination: 'GWEI',
    toDenomination: 'WEI',
  }) as string;
}

export function hexGWEIToHexWEI(decGWEI: NumericInput): string {
  return conversionUtil(decGWEI, {
    fromNumericBase: 'hex',
    toNumericBase: 'hex',
    fromDenomination: 'GWEI',
    toDenomination: 'WEI',
  }) as string;
}

export function hexWEIToDecGWEI(decGWEI: NumericInput): string {
  return conversionUtil(decGWEI, {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
    fromDenomination: 'WEI',
    toDenomination: 'GWEI',
  }) as string;
}

export function decETHToDecWEI(decEth: NumericInput): string {
  return conversionUtil(decEth, {
    fromNumericBase: 'dec',
    toNumericBase: 'dec',
    fromDenomination: 'ETH',
    toDenomination: 'WEI',
  }) as string;
}

export function hexWEIToDecETH(hexWEI: NumericInput): string {
  return conversionUtil(hexWEI, {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
    fromDenomination: 'WEI',
    toDenomination: 'ETH',
  }) as string;
}

export function addHexes(aHexWEI: NumericInput, bHexWEI: NumericInput): string {
  return addCurrencies(aHexWEI, bHexWEI, {
    aBase: 16,
    bBase: 16,
    toNumericBase: 'hex',
    numberOfDecimals: 6,
  }) as string;
}

export function sumHexWEIs(hexWEIs: (NumericInput | undefined | null)[]): string {
  return (hexWEIs.filter(Boolean) as NumericInput[]).reduce(
    (acc, cur) => addHexes(acc, cur),
  ) as string;
}

export function sumHexWEIsToUnformattedFiat(
  hexWEIs: (NumericInput | undefined | null)[],
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
  hexWEIs: (NumericInput | undefined | null)[],
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

export function formatETHFee(
  ethFee: string,
  currencySymbol: string = 'ETH',
  showLessThan?: boolean,
): string {
  if (showLessThan && ethFee === '0') return `< 0.000001 ${currencySymbol}`;
  return `${ethFee} ${currencySymbol}`;
}

export function sumHexWEIsToRenderableEth(
  hexWEIs: (NumericInput | undefined | null)[],
): string {
  const hexWEIsSum = (hexWEIs.filter(Boolean) as NumericInput[]).reduce(
    (acc, cur) => addHexes(acc, cur),
  );
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

export function decimalToPrefixedHex(decimal: NumericInput): string {
  return addHexPrefix(decimalToHex(decimal));
}
