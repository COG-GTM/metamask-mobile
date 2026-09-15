import { UseGasTransactionProps } from '../../../../../../../core/GasPolling/types';
import { useGasTransaction } from '../../../../../../../core/GasPolling/GasPolling';

type GasTransactionResult = Exclude<
  ReturnType<typeof useGasTransaction>,
  string
>;

type KeysOfUnion<T> = T extends unknown ? keyof T : never;

type ValueOfUnion<T, K extends PropertyKey> = T extends unknown
  ? K extends keyof T
    ? T[K]
    : undefined
  : never;

/**
 * Parsed gas data returned by `useGasTransaction` (EIP-1559 or legacy shape),
 * excluding the string error sentinels it can return when data is incomplete.
 * Every field is optional since its presence depends on the transaction type.
 */
export type GasTransaction = {
  [K in KeysOfUnion<GasTransactionResult>]?: ValueOfUnion<
    GasTransactionResult,
    K
  >;
};

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
  hideTotal?: boolean;
  /**
   * Boolean to determine the container should have no margin
   */
  noMargin?: boolean;
  /**
   * Origin (hostname) of the dapp that suggested the gas fee
   */
  origin?: string;
  /**
   * If it's a eip1559 network and dapp suggest legact gas then it should show a warning
   */
  originWarning?: string | boolean;
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
   * If loading should stop
   */
  gasEstimationReady?: boolean;
  /**
   * If should show legacy gas
   */
  legacy?: boolean;
  /**
   * The selected gas option
   */
  gasSelected?: string | null;
  /**
   * gas object for calculating the gas transaction cost
   */
  gasObject?: UseGasTransactionProps['gasObject'];
  gasObjectLegacy?: UseGasTransactionProps['gasObjectLegacy'];
  /**
   * update gas transaction state to parent
   */
  updateTransactionState?: (gasTransaction: GasTransaction) => void;
  onlyGas?: boolean;
  multiLayerL1FeeTotal?: string;
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
