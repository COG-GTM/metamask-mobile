import React from 'react';

export interface EditGasFeeLegacyUpdateProps {
  /**
   * Function called when user cancels
   */
  onCancel: () => void;
  /**
   * Function called when user saves the new gas
   */
  onSave: (
    gasTxn: EditLegacyGasTransaction,
    newGasObject: {
      suggestedGasPrice?: string;
      legacyGasLimit?: string;
    },
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
  analyticsParams: { [key: string]: string | undefined };
  view: string;
  onlyGas?: boolean;
  selectedGasObject: EditLegacyGasObject;
  hasDappSuggestedGas?: boolean;
  chainId: string;
}

export interface EditLegacyGasTransaction {
  suggestedGasLimit: string;
  suggestedGasPrice: string;
  transactionFee: string;
  transactionFeeFiat: string;
}

export interface EditLegacyGasObject {
  legacyGasLimit?: string;
  suggestedGasPrice?: string;
  suggestedMaxFeePerGas?: string;
}
