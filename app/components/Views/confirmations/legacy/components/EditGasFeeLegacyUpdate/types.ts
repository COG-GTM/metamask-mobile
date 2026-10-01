import type React from 'react';

export interface LegacySelectedGasObject {
  legacyGasLimit?: string;
  suggestedGasPrice?: string;
  suggestedMaxFeePerGas?: string;
}

export interface LegacyGasTxnSaveData {
  totalMaxHex?: string;
  totalHex?: string;
  error?: string;
  suggestedGasLimit?: string;
  [key: string]: unknown;
}

export interface LegacyNewGasObject {
  legacyGasLimit?: string;
  suggestedGasPrice?: string;
  suggestedMaxFeePerGas?: string;
  suggestedMaxPriorityFeePerGas?: string;
  suggestedGasLimit?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
}

export interface EditGasFeeLegacyUpdateProps {
  /**
   * Function called when user cancels
   */
  onCancel: () => void;
  /**
   * Function called when user saves the new gas
   */
  onSave: (
    gasTxn: LegacyGasTxnSaveData,
    newGasObject: LegacyNewGasObject,
  ) => void;
  /**
   * Error message to show
   */
  error?: string | React.ReactNode;
  /**
   * Warning message to show
   */
  warning?: string | React.ReactNode;
  /**
   * Extend options object. Object has option keys and properties will be spread
   */
  extendOptions?: Record<string, unknown>;
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
  analyticsParams: Record<string, unknown>;
  view: string;
  onlyGas?: boolean;
  selectedGasObject: LegacySelectedGasObject;
  hasDappSuggestedGas?: boolean;
  chainId: string;
}

export interface EditLegacyGasTransaction {
  suggestedGasLimit: string;
  suggestedGasPrice: string;
  transactionFee: string;
  transactionFeeFiat: string;
}
