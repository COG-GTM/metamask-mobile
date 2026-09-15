import BigNumber from 'bignumber.js';
import { ReactNode } from 'react';
import { GasTransaction } from '../TransactionReview/TransactionReviewEIP1559Update/types';

export interface UpdateOption {
  isCancel: boolean;
  maxFeeThreshold: string | BigNumber;
  maxPriortyFeeThreshold: string | BigNumber;
  showAdvanced: boolean | undefined;
}

export interface RenderInputProps {
  updateOption: UpdateOption | undefined;
}

/**
 * A single gas fee estimate level (low/medium/high) as returned by the gas fee controller
 */
export interface GasFeeOption {
  suggestedMaxFeePerGas?: string;
  suggestedMaxPriorityFeePerGas?: string;
  suggestedGasLimit?: string;
  minWaitTimeEstimate?: number;
  maxWaitTimeEstimate?: number;
}

export type GasFeeEstimateLevel = 'low' | 'medium' | 'high';

export type GasFeeEstimateOptions = Partial<
  Record<GasFeeEstimateLevel, GasFeeOption>
>;

export interface SelectedGasObject {
  suggestedMaxFeePerGas: string;
  suggestedMaxPriorityFeePerGas: string;
  suggestedGasLimit: string;
}
export interface EditGasFee1559UpdateProps {
  /**
   * The selected gas value (low, medium, high)
   */
  selectedGasValue: string | null;
  /**
   * Gas fee options.
   */
  gasOptions: GasFeeEstimateOptions;
  /**
   * Primary currency, either ETH or Fiat
   */
  primaryCurrency: string;
  /**
   * Option to display speed up/cancel view
   */
  updateOption?: UpdateOption;
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
  onChange?: (option: string | null) => void;
  /**
   * Function called when user cancels
   */
  onCancel?: () => void;
  /**
   * Function called when user saves the new gas data
   */
  onSave: (
    gasTransaction: GasTransaction,
    newGasPriceObject: SelectedGasObject,
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
    name: string;
    render: ReactNode | ((selected: boolean, disabled?: boolean) => ReactNode);
  };
  /**
   * Estimate option to compare with for too low warning
   */
  warningMinimumEstimateOption?: GasFeeEstimateLevel;
  /**
   * Suggested estimate option to show recommended values
   */
  suggestedEstimateOption?: GasFeeEstimateLevel;
  /**
   * Boolean to determine if the animation is happening
   */
  isAnimating?: boolean;
  /**
   * Extra analytics params to be send with the gas analytics
   */
  analyticsParams: {
    chain_id?: string;
    gas_estimate_type?: string;
    gas_mode?: string;
    speed_set?: string;
    view?: string;
    [key: string]: unknown;
  };
  /**
   * This is used in calculating the new gas price from the advanced view.
   * The maxFeePerGas is the max fee per gas that the user can set.
   * The maxPriorityFeePerGas is the max fee per gas that the user can set for priority transactions.
   */
  selectedGasObject: SelectedGasObject;
  onlyGas?: boolean;
}
