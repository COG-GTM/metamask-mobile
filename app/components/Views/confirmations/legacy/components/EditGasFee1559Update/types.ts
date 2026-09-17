import { ReactNode } from 'react';

// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GasAny = any;

export interface UpdateOption {
  isCancel: boolean;
  maxFeeThreshold: string;
  maxPriortyFeeThreshold: string;
  showAdvanced?: boolean;
}

export interface SelectedGasObject {
  suggestedMaxFeePerGas?: string;
  suggestedMaxPriorityFeePerGas?: string;
  suggestedGasLimit?: string;
}

export interface EditGasFee1559UpdateProps {
  /**
   * The selected gas value (low, medium, high)
   */
  selectedGasValue: string;
  /**
   * Gas fee options.
   */
  gasOptions: GasAny;
  /**
   * Primary currency, either ETH or Fiat
   */
  primaryCurrency: string;
  /**
   * A string representing the network chainId
   */
  chainId: string;
  /**
   * Option to display speed up/cancel view
   */
  updateOption?: UpdateOption;
  /**
   * If the values should animate upon update or not
   */
  animateOnChange?: boolean;
  /**
   * Function to set the gas selected value
   */
  onChange: GasAny;
  /**
   * Function called when user cancels
   */
  onCancel: () => void;
  /**
   * Function called when user saves the new gas data
   */
  onSave: (gasTransaction: GasAny, gasObject: GasAny) => void;
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
    name?: string;
    render?: ReactNode;
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
  isAnimating?: boolean;
  /**
   * Extra analytics params to be send with the gas analytics
   */
  analyticsParams: Record<string, unknown>;
  /**
   * This is used in calculating the new gas price from the advanced view.
   */
  selectedGasObject: SelectedGasObject;
  /**
   * Whether only the gas view should be displayed
   */
  onlyGas?: boolean;
  /**
   * Analytics view name (passed through by some callers)
   */
  view?: string;
  /**
   * Initial suggested gas limit (passed through by some callers)
   */
  initialSuggestedGasLimit?: string;
}
