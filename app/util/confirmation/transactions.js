/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  GAS_ESTIMATE_TYPES } from

'@metamask/gas-fee-controller';
import {
  TransactionEnvelopeType } from

'@metamask/transaction-controller';
import { addHexPrefix, safeBNToHex } from '../number';
import { safeToChecksumAddress } from '../address';

export function buildTransactionParams({
  gasDataEIP1559,
  gasDataLegacy,
  gasEstimateType,
  showCustomNonce,
  transaction






}) {
  const transactionParams = { ...transaction };
  const { nonce, value } = transaction;
  const { type } = transactionParams;

  transactionParams.from = safeToChecksumAddress(transaction.from);
  transactionParams.nonce = showCustomNonce ? safeBNToHex(nonce) : undefined;
  transactionParams.to = safeToChecksumAddress(transaction.to);
  transactionParams.value = safeBNToHex(value);

  if (
  gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET &&
  type !== TransactionEnvelopeType.legacy)
  {
    const {
      estimatedBaseFeeHex,
      gasLimitHex,
      suggestedMaxFeePerGasHex,
      suggestedMaxPriorityFeePerGasHex
    } = gasDataEIP1559;

    transactionParams.gas = addHexPrefix(gasLimitHex);
    transactionParams.gasPrice = undefined;
    transactionParams.maxFeePerGas = addHexPrefix(suggestedMaxFeePerGasHex);
    transactionParams.maxPriorityFeePerGas = addHexPrefix(
      suggestedMaxPriorityFeePerGasHex
    );
    transactionParams.estimatedBaseFee = addHexPrefix(estimatedBaseFeeHex);
  } else {
    const { suggestedGasLimitHex, suggestedGasPriceHex } = gasDataLegacy;

    transactionParams.gas = addHexPrefix(suggestedGasLimitHex);
    transactionParams.gasPrice = addHexPrefix(suggestedGasPriceHex);
    transactionParams.maxFeePerGas = undefined;
    transactionParams.maxPriorityFeePerGas = undefined;
  }

  return transactionParams;
}