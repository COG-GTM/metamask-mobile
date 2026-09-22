import BN from 'bnjs4';
import { renderFromWei, weiToFiat, toWei, conversionUtil } from '../number';
import { strings } from '../../../locales/i18n';
import TransactionTypes from '../../core/TransactionTypes';
import { estimateGas } from '../transaction-controller';
import { hexToBN } from '@metamask/controller-utils';

const typedToWei = toWei as unknown as (value: number, unit: string) => BN;
const typedRenderFromWei = renderFromWei as unknown as (value: BN) => string;
const typedWeiToFiat = weiToFiat as unknown as (
  value: BN,
  conversionRate: number,
  currencyCode: string,
) => string;
const typedConversionUtil = conversionUtil as unknown as (
  value: string | number,
  options: {
    fromNumericBase: string;
    toNumericBase: string;
    fromCurrency?: string;
    toCurrency?: string;
    numberOfDecimals?: number;
    fromDenomination?: string;
    toDenomination?: string;
    conversionRate?: string | number;
  },
) => string | number | BN;
const typedEstimateGas = estimateGas as unknown as (
  transaction: unknown,
  networkClientId?: string,
) => Promise<{ gas: string }>;
const typedHexToBN = hexToBN as unknown as (value: string) => BN;

export const ETH = 'ETH';
export const GWEI = 'GWEI';
export const WEI = 'WEI';

/**
 * Calculates wei value of estimate gas price in gwei
 *
 * @param {number} estimate - Number corresponding to api gas price estimation
 * @returns {Object} - BN instance containing gas price in wei
 */
export function apiEstimateModifiedToWEI(estimate: number): BN {
  return typedToWei(estimate, 'gwei');
}

/**
 * Calculates GWEI value of estimate gas price from ethgasstation.info
 *
 * @param {number} val - Number corresponding to api gas price estimation
 * @returns {string} - The GWEI value as a string
 */
export function convertApiValueToGWEI(val: number): string {
  return parseInt(val as unknown as string, 10).toString();
}

/**
 * Calculates gas fee in wei
 *
 * @param {number} estimate - Number corresponding to api gas price estimation
 * @param {number} gasLimit - Number corresponding to transaction gas limit
 * @returns {Object} - BN instance containing gas price in wei
 */
export function getWeiGasFee(estimate: number, gasLimit = 21000): BN {
  const apiEstimate = apiEstimateModifiedToWEI(estimate);
  const gasFee = apiEstimate.mul(new BN(gasLimit, 10));
  return gasFee;
}

/**
 * Calculates gas fee in eth
 *
 * @param {number} estimate - Number corresponding to api gas price estimation
 * @param {number} gasLimit - Number corresponding to transaction gas limit
 * @returns {Object} - BN instance containing gas price in wei
 */
export function getRenderableEthGasFee(
  estimate: number,
  gasLimit = 21000,
): string {
  const gasFee = getWeiGasFee(estimate, gasLimit);
  return typedRenderFromWei(gasFee);
}

/**
 * Calculates gas fee in fiat
 *
 * @param {number} estimate - Number corresponding to api gas price estimation
 * @param {number} conversionRate - Number corresponding to conversion rate for current `currencyCode`
 * @param {string} currencyCode - String corresponding to code of current currency
 * @param {number} gasLimit - Number corresponding to transaction gas limit
 * @returns {Object} - BN instance containing gas price in wei
 */
export function getRenderableFiatGasFee(
  estimate: number,
  conversionRate: number,
  currencyCode: string,
  gasLimit = 21000,
): string {
  const wei = getWeiGasFee(estimate, gasLimit);
  return typedWeiToFiat(wei, conversionRate, currencyCode);
}

/**
 * Parse minutes number to readable wait time
 *
 * @param {number} min - Minutes
 * @returns {string} - Readable wait time
 */
export function parseWaitTime(min: number): string {
  let tempMin = min,
    parsed = '',
    val;
  const timeUnits = [
    [strings('unit.week'), 10080],
    [strings('unit.day'), 1440],
    [strings('unit.hour'), 60],
    [strings('unit.minute'), 1],
  ];
  timeUnits.forEach((unit) => {
    if (parsed.includes(' ')) return;
    val = Math.floor(tempMin / unit[1]);
    if (val) {
      if (parsed !== '') parsed += ' ';
      parsed += `${val}${unit[0]}`;
    }
    tempMin = min % unit[1];
  });
  if (parsed === '') {
    val = (Math.round(tempMin * 100) * 3) / 5;
    if (val) {
      parsed += ` ${Math.ceil(val)}${strings('unit.second')}`;
    }
  }
  return parsed.trim();
}

export async function getGasLimit(
  transaction: Record<string, unknown>,
  resetGas = false,
  networkClientId?: string,
): Promise<{ gas: BN }> {
  let estimation: { gas: string };
  try {
    const newTransactionObj = resetGas
      ? { ...transaction, gas: undefined, gasPrice: undefined }
      : transaction;

    estimation = await typedEstimateGas(newTransactionObj, networkClientId);
  } catch (error) {
    estimation = {
      gas: TransactionTypes.CUSTOM_GAS.DEFAULT_GAS_LIMIT,
    };
  }

  const gas = typedHexToBN(estimation.gas);
  return { gas };
}

export function getValueFromWeiHex({
  value,
  fromCurrency = ETH,
  toCurrency,
  conversionRate,
  numberOfDecimals,
  toDenomination,
}: {
  value: string | number;
  fromCurrency?: string;
  toCurrency?: string;
  conversionRate?: string | number;
  numberOfDecimals?: number;
  toDenomination?: string;
}): string | number | BN {
  return typedConversionUtil(value, {
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
