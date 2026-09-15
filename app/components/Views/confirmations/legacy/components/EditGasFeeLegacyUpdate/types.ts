import { ReactNode } from 'react';

export interface LegacyGasObject {
  legacyGasLimit?: string;
  suggestedGasPrice?: string;
  suggestedMaxFeePerGas?: string;
}

export interface EditGasFeeLegacyUpdateProps {
  /**
   * Function called when user cancels
   */
  onCancel?: () => void;
  /**
   * Function called when user saves the new gas
   */
  onSave: (
    gasTxn: EditLegacyGasTransaction,
    newGasObject: LegacyGasObject,
  ) => void;
  /**
   * Error message to show
   */
  error?: ReactNode;
  /**
   * Warning message to show
   */
  warning?: ReactNode;
  /**
   * Extend options object. Object has option keys and properties will be spread
   */
  extendOptions?: Record<string, Record<string, unknown>>;
  /**
   * Function to call when update animation starts
   */
  onUpdatingValuesStart: () => void;
  /**
   * Function to call when update animation ends
   */
  onUpdatingValuesEnd: () => void;
  /**
   * If the values should animate upon update or not
   */
  animateOnChange: boolean | undefined;
  /**
   * Boolean to determine if the animation is happening
   */
  isAnimating: boolean;
  /**
   * Extra analytics params to be send with the gas analytics
   */
  analyticsParams?: Record<string, unknown>;
  view: string;
  onlyGas?: boolean;
  selectedGasObject: LegacyGasObject;
  hasDappSuggestedGas?: boolean;
  chainId: string;
}

export interface EditLegacyGasTransaction {
  suggestedGasLimit?: string;
  suggestedGasPrice?: string;
  transactionFee?: string;
  transactionFeeFiat?: string;
}
