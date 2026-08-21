import BigNumber from 'bignumber.js';
import { ReactNode } from 'react';
import { JsonMap } from '../../../../../../core/Analytics/MetaMetrics.types';
import { GasTransaction } from '../TransactionReview/TransactionReviewEIP1559Update/types';

/**
 * A single EIP1559 gas fee estimate, as returned by the gas fee controller for
 * each of the `low` / `medium` / `high` options.
 */
export interface GasFeeEstimateLevel {
  maxWaitTimeEstimate?: number;
  minWaitTimeEstimate?: number;
  suggestedMaxFeePerGas: string;
  suggestedMaxPriorityFeePerGas: string;
  suggestedGasLimit?: string;
}

/**
 * Options displayed for a speed up / cancel transaction update.
 */
export interface UpdateOption {
  isCancel: boolean;
  maxFeeThreshold: BigNumber | string;
  maxPriortyFeeThreshold: BigNumber | string;
  showAdvanced?: boolean;
}

export interface RenderInputProps {
  updateOption: UpdateOption | undefined;
}

/**
 * The gas object held in local state and passed to the gas polling hook.
 */
export interface SelectedGasObject {
  suggestedMaxFeePerGas?: string;
  suggestedMaxPriorityFeePerGas?: string;
  suggestedGasLimit?: string;
}

export interface RecommendedOption {
  name: string;
  render: ReactNode;
}


export interface EditGasFee1559UpdateProps {
  /**
   * The selected gas value (low, medium, high)
   */
  selectedGasValue: string;
  /**
   * Gas fee options, keyed by estimate level.
   */
  gasOptions: unknown;
  /**
   * Primary currency, either ETH or Fiat
   */
  primaryCurrency?: string;
  /**
   * Option to display speed up/cancel view
   */
  updateOption?: UpdateOption;
  /**
   * If the values should animate upon update or not
   */
  animateOnChange?: boolean;
  /**
   * A string representing the network chainId
   */
  chainId?: string;
  /**
   * Name of the view the component is rendered from, sent with the analytics
   */
  view?: string;
  /**
   * Gas limit suggested when the screen was opened
   */
  initialSuggestedGasLimit?: string;
  /**
   * Function to set the gas selected value
   */
  onChange: (selected: string | null) => void;
  /**
   * Function called when user cancels
   */
  onCancel: () => void;
  /**
   * Function called when user saves the new gas data
   */
  onSave: (
    gasTransaction: GasTransaction,
    newGasPriceObject?: SelectedGasObject,
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
  recommended?: RecommendedOption;
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
  isAnimating?: boolean;
  /**
   * Extra analytics params to be send with the gas analytics
   */
  analyticsParams?: JsonMap;
  /**
   * This is used in calculating the new gas price from the advanced view.
   * The maxFeePerGas is the max fee per gas that the user can set.
   * The maxPriorityFeePerGas is the max fee per gas that the user can set for priority transactions.
   */
  selectedGasObject: SelectedGasObject;
  onlyGas?: boolean;
}

/**
 * Reads a single gas fee estimate level out of the gas fee estimates returned
 * by the gas fee controller, which is a union of several estimate shapes.
 */
export const getGasFeeEstimateLevel = (
  gasOptions: unknown,
  level?: string | null,
): GasFeeEstimateLevel | undefined => {
  if (!gasOptions || typeof gasOptions !== 'object' || !level) {
    return undefined;
  }
  const estimate = (gasOptions as Record<string, unknown>)[level];
  if (estimate && typeof estimate === 'object') {
    return estimate as GasFeeEstimateLevel;
  }
  return undefined;
};
