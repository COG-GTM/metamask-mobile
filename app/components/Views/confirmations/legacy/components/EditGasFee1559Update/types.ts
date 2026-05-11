import type React from 'react';
import type { GasFeeOptions } from '../../../../../../core/GasPolling/types';

export interface RenderInputProps {
  isCancel?: boolean;
  maxFeeThreshold?: string;
  maxPriortyFeeThreshold?: string;
  showAdvanced?: boolean;
}

export interface GasTxnSaveData {
  totalMaxHex?: string;
  totalHex?: string;
  error?: string;
  suggestedGasLimit?: string;
  [key: string]: unknown;
}

export interface NewGasObject {
  suggestedMaxFeePerGas?: string;
  suggestedMaxPriorityFeePerGas?: string;
  suggestedGasLimit?: string;
  legacyGasLimit?: string;
  suggestedGasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
}

export interface EditGasFee1559UpdateProps {
  /**
   * The selected gas value (low, medium, high)
   */
  selectedGasValue: string;
  /**
   * Gas fee options.
   */
  gasOptions: GasFeeOptions;
  /**
   * Primary currency, either ETH or Fiat
   */
  primaryCurrency: string;
  /**
   * Option to display speed up/cancel view
   */
  updateOption?: RenderInputProps;
  /**
   * If the values should animate upon update or not
   */
  animateOnChange: boolean | undefined;
  /**
   * A string representing the network chainId
   */
  chainId: string;
  /**
   * Function to set the gas selected value
   */
  onChange: (option: string | null) => void;
  /**
   * Function called when user cancels
   */
  onCancel: () => void;
  /**
   * Function called when user saves the new gas data
   */
  onSave: (gasTxn: GasTxnSaveData, newGasObject: NewGasObject) => void;
  /**
   * Error message to show
   */
  error?: string | React.ReactNode;
  /**
   * Warning message to show
   */
  warning?: string | React.ReactNode;
  /**
   * Boolean that specifies if the gas price was suggested by the dapp
   */
  dappSuggestedGas?: boolean;
  /**
   * An array of selected gas value and lower that should be ignored.
   */
  ignoreOptions?: string[];
  /**
   * Extend options object. Object has option keys and properties will be spread
   */
  extendOptions?: Record<string, Record<string, unknown>>;
  /**
   * Recommended object with type and render function
   */
  recommended?: {
    name?: string;
    render?: React.ReactNode;
  };
  /**
   * Estimate option to compare with for too low warning
   */
  warningMinimumEstimateOption?: string;
  /**
   * Suggested estimate option to show recommended values
   */
  suggestedEstimateOption?: string;
  /**
   * Boolean to determine if the animation is happening
   */
  isAnimating: boolean;
  /**
   * Extra analytics params to be send with the gas analytics
   */
  analyticsParams: Record<string, unknown> & {
    chain_id?: string;
    gas_estimate_type?: string;
    gas_mode?: string;
    speed_set?: string;
    view?: string;
  };
  /**
   * This is used in calculating the new gas price from the advanced view.
   * The maxFeePerGas is the max fee per gas that the user can set.
   * The maxPriorityFeePerGas is the max fee per gas that the user can set for priority transactions.
   */
  selectedGasObject: {
    suggestedMaxFeePerGas: string;
    suggestedMaxPriorityFeePerGas: string;
    suggestedGasLimit: string;
  };
  onlyGas?: boolean;
}
