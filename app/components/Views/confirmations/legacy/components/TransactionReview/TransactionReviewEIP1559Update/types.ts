import { Insets, TextStyle, ViewStyle } from 'react-native';

export interface TransactionEIP1559UpdateProps {
  /**
   * Selected primary currency
   */
  primaryCurrency: string;
  /**
   * The network chainId
   */
  chainId: string;
  /**
   * Function called when user clicks to edit the gas fee
   */
  onEdit: () => void;
  /**
   * Boolean to determine if the total section should be hidden
   */
  hideTotal: boolean;
  /**
   * Boolean to determine the container should have no margin
   */
  noMargin: boolean;
  /**
   * Origin (hostname) of the dapp that suggested the gas fee
   */
  origin: string;
  /**
   * If it's a eip1559 network and dapp suggest legact gas then it should show a warning
   */
  originWarning: string;
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
  animateOnChange: boolean;
  /**
   * Boolean to determine if the animation is happening
   */
  isAnimating: boolean;
  /**
   * If loading should stop
   */
  gasEstimationReady: boolean;
  /**
   * If should show legacy gas
   */
  legacy: boolean;
  /**
   * The selected gas option
   */
  gasSelected: string;
  /**
   * gas object for calculating the gas transaction cost
   */
  gasObject: {
    suggestedMaxFeePerGas: string;
    suggestedMaxPriorityFeePerGas: string;
  };
  gasObjectLegacy: {
    legacyGasLimit?: string;
    suggestedGasPrice?: string;
  };
  /**
   * update gas transaction state to parent
   */
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateTransactionState: any;
  onlyGas: boolean;
  multiLayerL1FeeTotal?: string;
}

/**
 * Shape of the renderable gas data returned by the useGasTransaction hook
 * for this component. The hook returns a broad union; the fields below are
 * the string values this component consumes.
 */
export interface TransactionReviewGasData {
  gasFeeMaxNative: string;
  renderableGasFeeMinNative: string;
  renderableGasFeeMinConversion: string;
  renderableGasFeeMaxNative: string;
  renderableTotalMinNative: string;
  renderableTotalMinConversion: string;
  renderableTotalMaxNative: string;
  renderableGasFeeMaxConversion: string;
  timeEstimateColor: string;
  timeEstimate: string;
  timeEstimateId: string;
  transactionFee: string;
  transactionFeeFiat: string;
  transactionTotalAmount: string;
  transactionTotalAmountFiat: string;
  suggestedGasLimit: string;
}

/**
 * Shape of the styles object produced by createStyles in ./styles.
 * overview and gasInfoIcon are function-style members.
 */
export interface TransactionReviewStyles {
  overview: (noMargin: boolean) => ViewStyle;
  valuesContainer: ViewStyle;
  gasInfoContainer: ViewStyle;
  gasInfoIcon: (hasOrigin: string) => TextStyle;
  amountContainer: ViewStyle;
  gasRowContainer: ViewStyle;
  gasBottomRowContainer: ViewStyle;
  hitSlop: Insets;
  redInfo: TextStyle;
  timeEstimateContainer: ViewStyle;
  flex: ViewStyle;
}

export interface SkeletonProps {
  /**
   * Skeleton width
   */
  width: number;
  /**
   * if noStyle is passed to skeleton
   */
  noStyle?: boolean;
}

export interface SkeletonProps {
  /**
   * Skeleton width
   */
  width: number;
  /**
   * if noStyle is passed to skeleton
   */
  noStyle?: boolean;
}
