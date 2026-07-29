import { GasEstimateType } from '@metamask/gas-fee-controller';
import { GasTransactionProps } from '../../../../../core/GasPolling/types';

/**
 * Gas fee data as parsed by `parseTransactionEIP1559`.
 */
export interface EIP1559GasTransaction extends Partial<GasTransactionProps> {
  error?: string;
  selectedOption?: string | null;
}

/**
 * Gas fee data as parsed by `parseTransactionLegacy`.
 */
export interface LegacyGasTransaction {
  error?: string;
  suggestedGasLimit?: string;
  suggestedGasLimitHex?: string;
  suggestedGasPrice?: string;
  suggestedGasPriceHex?: string;
  totalHex?: string;
  transactionFee?: string;
  transactionFeeFiat?: string;
}

/**
 * Gas values kept by a screen for a legacy (non EIP1559) transaction.
 */
export interface LegacyGasObject {
  legacyGasLimit?: string;
  suggestedGasPrice?: string;
}

/**
 * Gas fee option as suggested by the gas fee controller or by the dapp.
 */
export interface SuggestedGasFee {
  estimatedBaseFee?: string;
  selectedOption?: string | null;
  suggestedGasLimit?: string;
  suggestedMaxFeePerGas?: string;
  suggestedMaxPriorityFeePerGas?: string;
}

/**
 * Gas fee estimates as returned by the gas fee controller. The available keys
 * depend on the current estimate type.
 */
export type GasFeeEstimates = Record<string, unknown> & {
  estimatedBaseFee?: string;
  gasPrice?: string;
};

/**
 * Payload handed over to the `onConfirm` callback of the transaction editor
 * once the transaction has been validated.
 */
export interface TransactionEditorConfirmParams {
  gasEstimateType: GasEstimateType;
  EIP1559GasData: EIP1559GasTransaction;
  gasSelected: string | null;
}
