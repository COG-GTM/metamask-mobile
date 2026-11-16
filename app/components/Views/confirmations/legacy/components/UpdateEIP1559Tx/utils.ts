import { CANCEL_RATE, SPEED_UP_RATE } from '@metamask/transaction-controller';
import { isHexString } from '@metamask/utils';
import BigNumber from 'bignumber.js';
import { strings } from '../../../../../../../locales/i18n';
import {
  addHexPrefix,
  hexToBN,
  renderFromWei,
} from '../../../../../../util/number';
import { getTicker } from '../../../../../../util/transactions';
import { UpdateTx1559Options } from './types';

export interface ExistingEIP1559Gas {
  maxFeePerGas: BigNumber.Value;
  maxPriorityFeePerGas: BigNumber.Value;
}

export interface FeeFloorCheck {
  result: boolean;
  value: BigNumber;
}

export interface UpdateTxValues {
  totalMaxHex: string;
  suggestedMaxFeePerGas: BigNumber.Value;
  suggestedMaxPriorityFeePerGas: BigNumber.Value;
}

export interface MediumGasFeeEstimate {
  suggestedMaxFeePerGas: string;
  suggestedMaxPriorityFeePerGas: string;
}

export const getReplacementRate = (isCancel: boolean): number =>
  isCancel ? CANCEL_RATE : SPEED_UP_RATE;

export const getReplacementFeeFloor = (
  existingValue: BigNumber.Value,
  isCancel: boolean,
): BigNumber =>
  new BigNumber(existingValue).times(
    new BigNumber(getReplacementRate(isCancel)),
  );

export const isMaxFeePerGasMoreThanLegacy = (
  existingGas: ExistingEIP1559Gas,
  isCancel: boolean,
  maxFeePerGas: BigNumber.Value,
): FeeFloorCheck => {
  const value = getReplacementFeeFloor(existingGas.maxFeePerGas, isCancel);
  return { result: new BigNumber(maxFeePerGas).gte(value), value };
};

export const isMaxPriorityFeePerGasMoreThanLegacy = (
  existingGas: ExistingEIP1559Gas,
  isCancel: boolean,
  maxPriorityFeePerGas: BigNumber.Value,
): FeeFloorCheck => {
  const value = getReplacementFeeFloor(
    existingGas.maxPriorityFeePerGas,
    isCancel,
  );
  return { result: new BigNumber(maxPriorityFeePerGas).gte(value), value };
};

export const validateUpdateTxAmount = ({
  updateTx,
  accountBalance,
  existingGas,
  isCancel,
  ticker,
}: {
  updateTx: UpdateTxValues;
  accountBalance: string;
  existingGas: ExistingEIP1559Gas;
  isCancel: boolean;
  ticker?: string;
}): string | undefined => {
  const totalMaxHexPrefixed = addHexPrefix(updateTx.totalMaxHex);

  if (!isHexString(totalMaxHexPrefixed)) {
    return strings('transaction.invalid_amount');
  }

  const updateTxCost = hexToBN(totalMaxHexPrefixed);
  const balance = hexToBN(accountBalance);

  if (balance.lt(updateTxCost)) {
    return strings('transaction.insufficient_amount', {
      amount: renderFromWei(updateTxCost.sub(balance)),
      tokenSymbol: getTicker(ticker),
    });
  }

  const maxFeeCheck = isMaxFeePerGasMoreThanLegacy(
    existingGas,
    isCancel,
    updateTx.suggestedMaxFeePerGas,
  );
  if (!maxFeeCheck.result) {
    return isCancel
      ? strings('edit_gas_fee_eip1559.max_fee_cancel_low', {
          cancel_value: maxFeeCheck.value,
        })
      : strings('edit_gas_fee_eip1559.max_fee_speed_up_low', {
          speed_up_floor_value: maxFeeCheck.value,
        });
  }

  const maxPriorityFeeCheck = isMaxPriorityFeePerGasMoreThanLegacy(
    existingGas,
    isCancel,
    updateTx.suggestedMaxPriorityFeePerGas,
  );
  if (!maxPriorityFeeCheck.result) {
    return isCancel
      ? strings('edit_gas_fee_eip1559.max_priority_fee_cancel_low', {
          cancel_value: maxPriorityFeeCheck.value,
        })
      : strings('edit_gas_fee_eip1559.max_priority_fee_speed_up_low', {
          speed_up_floor_value: maxPriorityFeeCheck.value,
        });
  }

  return undefined;
};

/**
 * Picks the initial thresholds for the speed-up/cancel sheet. When the market
 * medium estimate is below the replacement floor (existing fee times the
 * speed-up/cancel rate), only the advanced view with the floor is offered.
 */
export const getInitialUpdateTx1559Options = ({
  existingGas,
  mediumEstimate,
  isCancel,
}: {
  existingGas: ExistingEIP1559Gas;
  mediumEstimate: MediumGasFeeEstimate;
  isCancel: boolean;
}): UpdateTx1559Options => {
  const maxFeeCheck = isMaxFeePerGasMoreThanLegacy(
    existingGas,
    isCancel,
    mediumEstimate.suggestedMaxFeePerGas,
  );
  const maxPriorityFeeCheck = isMaxPriorityFeePerGasMoreThanLegacy(
    existingGas,
    isCancel,
    mediumEstimate.suggestedMaxPriorityFeePerGas,
  );

  if (!maxFeeCheck.result || !maxPriorityFeeCheck.result) {
    return {
      maxPriortyFeeThreshold: maxPriorityFeeCheck.value,
      maxFeeThreshold: maxFeeCheck.value,
      showAdvanced: true,
      isCancel,
    };
  }

  return {
    maxPriortyFeeThreshold: mediumEstimate.suggestedMaxPriorityFeePerGas,
    maxFeeThreshold: mediumEstimate.suggestedMaxFeePerGas,
    showAdvanced: false,
    isCancel,
  };
};
