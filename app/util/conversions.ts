import { hexToBN } from '@metamask/controller-utils';
import type BigNumber from 'bignumber.js';
import { ETH, GWEI, WEI } from './custom-gas';
import {
  conversionUtil,
  addCurrencies,
  subtractCurrencies,
  type ConversionResult,
  type ConvertibleValue,
  type EthDenomination,
} from './conversion';
import { formatCurrency } from './confirm-tx';
import { addHexPrefix } from './number';

/**
 * A conversion rate, which callers hand over either as a plain number or as an
 * already-instantiated `BigNumber`.
 */
export type ConversionRate = number | string | BigNumber | null | undefined;

/**
 * All of the conversions below request an explicit numeric base, so the
 * converter always hands back a string. The only exception is the
 * `conversionUtil` shortcut that returns `0` when a currency conversion is
 * requested without a rate.
 */
const asString = (result: ConversionResult | number): string =>
  typeof result === 'string' ? result : result.toString();

export function hexToDecimal(hexValue: ConvertibleValue): string {
  return asString(
    conversionUtil(hexValue, {
      fromNumericBase: 'hex',
      toNumericBase: 'dec',
    }),
  );
}

export function decimalToHex(decimal: ConvertibleValue): string {
  return asString(
    conversionUtil(decimal, {
      fromNumericBase: 'dec',
      toNumericBase: 'hex',
    }),
  );
}

export function getEthConversionFromWeiHex({
  value,
  fromCurrency = ETH,
  conversionRate,
  numberOfDecimals = 6,
}: {
  value: ConvertibleValue;
  fromCurrency?: string;
  conversionRate?: ConversionRate;
  numberOfDecimals?: number;
}): string | undefined {
  const denominations = [fromCurrency, GWEI, WEI];

  let nonZeroDenomination;

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
  value: ConvertibleValue;
  fromCurrency?: string;
  toCurrency?: string;
  conversionRate?: ConversionRate;
  numberOfDecimals?: number;
  toDenomination?: EthDenomination;
}): string {
  return asString(
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

export function getWeiHexFromDecimalValue({
  value,
  fromCurrency,
  conversionRate,
  fromDenomination,
  invertConversionRate,
}: {
  value: ConvertibleValue;
  fromCurrency?: string;
  conversionRate?: ConversionRate;
  fromDenomination?: EthDenomination;
  invertConversionRate?: boolean;
}): string {
  return asString(
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
  aHexWEI: ConvertibleValue,
  bHexWEI: ConvertibleValue,
): string {
  return asString(
    addCurrencies(aHexWEI, bHexWEI, {
      aBase: 16,
      bBase: 16,
      fromDenomination: 'WEI',
      numberOfDecimals: 6,
    }),
  );
}

export function subtractHexWEIsToDec(
  aHexWEI: ConvertibleValue,
  bHexWEI: ConvertibleValue,
): string {
  return asString(
    subtractCurrencies(aHexWEI, bHexWEI, {
      aBase: 16,
      bBase: 16,
      fromDenomination: 'WEI',
      numberOfDecimals: 6,
    }),
  );
}

export function decEthToConvertedCurrency(
  ethTotal: ConvertibleValue,
  convertedCurrency: string,
  conversionRate: ConversionRate,
): string {
  return asString(
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

export function decGWEIToHexWEI(decGWEI: ConvertibleValue): string {
  return asString(
    conversionUtil(decGWEI, {
      fromNumericBase: 'dec',
      toNumericBase: 'hex',
      fromDenomination: 'GWEI',
      toDenomination: 'WEI',
    }),
  );
}

export function hexGWEIToHexWEI(decGWEI: ConvertibleValue): string {
  return asString(
    conversionUtil(decGWEI, {
      fromNumericBase: 'hex',
      toNumericBase: 'hex',
      fromDenomination: 'GWEI',
      toDenomination: 'WEI',
    }),
  );
}

export function hexWEIToDecGWEI(decGWEI: ConvertibleValue): string {
  return asString(
    conversionUtil(decGWEI, {
      fromNumericBase: 'hex',
      toNumericBase: 'dec',
      fromDenomination: 'WEI',
      toDenomination: 'GWEI',
    }),
  );
}

export function decETHToDecWEI(decEth: ConvertibleValue): string {
  return asString(
    conversionUtil(decEth, {
      fromNumericBase: 'dec',
      toNumericBase: 'dec',
      fromDenomination: 'ETH',
      toDenomination: 'WEI',
    }),
  );
}

export function hexWEIToDecETH(hexWEI: ConvertibleValue): string {
  return asString(
    conversionUtil(hexWEI, {
      fromNumericBase: 'hex',
      toNumericBase: 'dec',
      fromDenomination: 'WEI',
      toDenomination: 'ETH',
    }),
  );
}

export function addHexes(
  aHexWEI: ConvertibleValue,
  bHexWEI: ConvertibleValue,
): string {
  return asString(
    addCurrencies(aHexWEI, bHexWEI, {
      aBase: 16,
      bBase: 16,
      toNumericBase: 'hex',
      numberOfDecimals: 6,
    }),
  );
}

export function sumHexWEIs(hexWEIs: (string | undefined | null)[]): string {
  return hexWEIs
    .filter((hexWEI): hexWEI is string => Boolean(hexWEI))
    .reduce((total, hexWEI) => addHexes(total, hexWEI));
}

export function sumHexWEIsToUnformattedFiat(
  hexWEIs: (string | undefined | null)[],
  convertedCurrency: string,
  conversionRate: ConversionRate,
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
  hexWEIs: (string | undefined | null)[],
  convertedCurrency: string,
  conversionRate: ConversionRate,
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
  currencySymbol = 'ETH',
  showLessThan?: boolean,
): string {
  if (showLessThan && ethFee === '0') return `< 0.000001 ${currencySymbol}`;
  return `${ethFee} ${currencySymbol}`;
}

export function sumHexWEIsToRenderableEth(
  hexWEIs: (string | undefined | null)[],
): string {
  const hexWEIsSum = sumHexWEIs(hexWEIs);
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

export function decimalToPrefixedHex(decimal: ConvertibleValue): string {
  return addHexPrefix(decimalToHex(decimal));
}
