// eslint-disable-next-line no-duplicate-imports
import BN4 from 'bnjs4';
// eslint-disable-next-line no-duplicate-imports, import/no-duplicates
import type BN from 'bnjs4';
import type { TransactionParams } from '@metamask/transaction-controller';
import type { NetworkClientId } from '@metamask/network-controller';
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
 *
 * @param estimate - Number corresponding to api gas price estimation
 * @returns BN instance containing gas price in wei
 */
export function apiEstimateModifiedToWEI(estimate: number | string): BN {
  return toWei(estimate, 'gwei');
}

/**
 * Calculates GWEI value of estimate gas price from ethgasstation.info
 *
 * @param val - Number corresponding to api gas price estimation
 * @returns The GWEI value as a string
 */
export function convertApiValueToGWEI(val: number | string): string {
  return parseInt(val as string, 10).toString();
}

/**
 * Calculates gas fee in wei
 *
 * @param estimate - Number corresponding to api gas price estimation
 * @param gasLimit - Number corresponding to transaction gas limit
 * @returns BN instance containing gas price in wei
 */
export function getWeiGasFee(
  estimate: number | string,
  gasLimit: number = 21000,
): BN {
  const apiEstimate = apiEstimateModifiedToWEI(estimate);
  const gasFee = apiEstimate.mul(new BN4(gasLimit, 10));
  return gasFee;
}

/**
 * Calculates gas fee in eth
 *
 * @param estimate - Number corresponding to api gas price estimation
 * @param gasLimit - Number corresponding to transaction gas limit
 * @returns Eth-denominated gas fee string
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
 * @param estimate - Number corresponding to api gas price estimation
 * @param conversionRate - Number corresponding to conversion rate for current `currencyCode`
 * @param currencyCode - String corresponding to code of current currency
 * @param gasLimit - Number corresponding to transaction gas limit
 * @returns Fiat-denominated gas fee string
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
 * @param min - Minutes
 * @returns Readable wait time
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

export async function getGasLimit(
  transaction: Partial<TransactionParams>,
  resetGas: boolean = false,
  networkClientId?: NetworkClientId,
): Promise<{ gas: BN }> {
  let estimation: { gas: string };
  try {
    const newTransactionObj = resetGas
      ? { ...transaction, gas: undefined, gasPrice: undefined }
      : transaction;

    estimation = await estimateGas(
      newTransactionObj as TransactionParams,
      networkClientId as NetworkClientId,
    );
  } catch (error) {
    estimation = {
      gas: TransactionTypes.CUSTOM_GAS.DEFAULT_GAS_LIMIT,
    };
  }

  // hexToBN returns BN from bn.js@5 (types); cast to BN4 (bn.js@4) which is
  // runtime-compatible. Both expose the same numeric methods.
  const gas = hexToBN(estimation.gas) as unknown as BN;
  return { gas };
}

export interface GetValueFromWeiHexOptions {
  value: string;
  fromCurrency?: string;
  toCurrency?: string;
  // `conversionRate` is also commonly passed as a BigNumber instance for
  // higher precision, so accept BigNumber-shaped objects in addition to the
  // numeric and string forms supported by the original JavaScript helper.
  conversionRate?: number | string | { toString(): string };
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
