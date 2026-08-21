import { ReactNode } from 'react';
import { JsonMap } from '../../../../../../core/Analytics/MetaMetrics.types';
import { GasTransaction } from '../TransactionReview/TransactionReviewEIP1559Update/types';

/**
 * Gas values kept by the parent screen for a legacy (non EIP1559) transaction.
 */
export interface LegacyGasObject {
  legacyGasLimit?: string;
  suggestedGasPrice?: string;
  suggestedMaxFeePerGas?: string;
}

export interface EditGasFeeLegacyUpdateProps {
  /**
   * Function called when user cancels
   */
  onCancel: () => void;
  /**
   * Function called when user saves the new gas
   */
  onSave: (gasTxn: GasTransaction, newGasObject: LegacyGasObject) => void;
  /**
   * Error message to show
   */
  error?: ReactNode;
  /**
   * Warning message to show
   */
  warning?: ReactNode;
  /**
   * Function to call when update animation starts
   */
  onUpdatingValuesStart?: () => void;
  /**
   * Function to call when update animation ends
   */
  onUpdatingValuesEnd?: () => void;
  /**
   * If the values should animate upon update or not
   */
  animateOnChange?: boolean;
  /**
   * Boolean to determine if the animation is happening
   */
  isAnimating?: boolean;
  /**
   * Extra analytics params to be send with the gas analytics
   */
  analyticsParams?: JsonMap;
  view: string;
  onlyGas?: boolean;
  selectedGasObject: LegacyGasObject;
  hasDappSuggestedGas?: boolean;
  chainId?: string;
}

export interface EditLegacyGasTransaction {
  suggestedGasLimit: string;
  suggestedGasPrice: string;
  transactionFee: string;
  transactionFeeFiat: string;
}
