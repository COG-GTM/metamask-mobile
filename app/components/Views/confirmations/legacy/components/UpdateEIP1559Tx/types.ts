import { GasTransaction } from '../TransactionReview/TransactionReviewEIP1559Update/types';

export interface ExistingGas {
  /**
   * The max fee of the transaction being sped up or cancelled
   */
  maxFeePerGas: string;
  /**
   * The max priority fee of the transaction being sped up or cancelled
   */
  maxPriorityFeePerGas: string;
  isEIP1559Transaction?: boolean;
}

export interface UpdateEIP1559Props {
  /**
   * Map of accounts to information objects including balances
   */
  accounts: Record<string, { balance: string }>;
  /**
   * Chain Id
   */
  chainId?: string;
  /**
   * ETH or fiat, depending on user setting
   */
  primaryCurrency?: string;
  /**
   * Gas fee estimates returned by the gas fee controller. The shape depends on
   * the estimate type, so it is narrowed where it is read.
   */
  gasFeeEstimates: unknown;
  /**
   * Estimate type returned by the gas fee controller, can be market-fee, legacy or eth_gasPrice
   */
  gasEstimateType: string;
  /**
   * A string that represents the selected address
   */
  selectedAddress?: string;
  /**
   * A bool indicates whether tx is speed up/cancel
   */
  isCancel: boolean;
  /**
   * Current provider ticker
   */
  ticker?: string;
  /**
   * The max fee and max priorty fee selected tx
   */
  existingGas: ExistingGas;
  /**
   * Gas object used to get suggestedGasLimit
   */
  gas: string;
  /**
   * Function that cancels the tx update
   */
  onCancel: () => void;
  /**
   * Function that performs the rest of the tx update
   */
  onSave: (tx: GasTransaction) => void;
}
