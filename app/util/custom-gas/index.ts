import BN from 'bnjs4';
import { renderFromWei, weiToFiat, toWei, conversionUtil } from '../number';
import { strings } from '../../../locales/i18n';
import TransactionTypes from '../../core/TransactionTypes';
import { estimateGas } from '../transaction-controller';
import { hexToBN } from '@metamask/controller-utils';

export const ETH = 'ETH';
export const GWEI = 'GWEI';
export const WEI = 'WEI';

/**
 * Calculates wei value of estimate gas price in gwei
 */
export function apiEstimateModifiedToWEI(estimate: number | string): BN {
  return toWei(estimate, 'gwei');
}

/**
 * Calculates GWEI value of estimate gas price from ethgasstation.info
 */
export function convertApiValueToGWEI(val: string | number): string {
  return parseInt(String(val), 10).toString();
}

/**
 * Calculates gas fee in wei
 *
 * @param {number} estimate - Number corresponding to api gas price estimation
 * @param {number} gasLimit - Number corresponding to transaction gas limit
 * @returns {Object} - BN instance containing gas price in wei
 */
export function getWeiGasFee(
  estimate: number | string,
  gasLimit: number = 21000,
): BN {
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
  estimate: number | string,
  gasLimit: number = 21000,
): string {
  const gasFee = getWeiGasFee(estimate, gasLimit);
  return renderFromWei(gasFee);
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
  estimate: number | string,
  conversionRate: number,
  currencyCode: string,
  gasLimit: number = 21000,
): string {
  const wei = getWeiGasFee(estimate, gasLimit);
  return weiToFiat(wei, conversionRate, currencyCode) ?? '';
}

/**
 * Parse minutes number to readable wait time
 *
 * @param {number} min - Minutes
 * @returns {string} - Readable wait time
 */
export function parseWaitTime(min: number): string {
  let tempMin = min;
  let parsed = '';
  let val: number;
  const timeUnits: [string, number][] = [
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

interface TransactionLike {
  gas?: string;
  gasPrice?: string;
  [key: string]: unknown;
}

export async function getGasLimit(
  transaction: TransactionLike,
  resetGas: boolean = false,
  networkClientId?: string,
): Promise<{ gas: BN }> {
  let estimation: { gas: string };
  try {
    const newTransactionObj = resetGas
      ? { ...transaction, gas: undefined, gasPrice: undefined }
      : transaction;

    estimation = (await estimateGas(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      newTransactionObj as any,
      networkClientId ?? '',
    )) as { gas: string };
  } catch (error) {
    estimation = {
      gas: TransactionTypes.CUSTOM_GAS.DEFAULT_GAS_LIMIT,
    };
  }

  const gas = hexToBN(estimation.gas);
  return { gas: gas as unknown as BN };
}

interface GetValueFromWeiHexOptions {
  value: string | number;
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
