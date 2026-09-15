import { AccountInformation } from '@metamask/assets-controllers';
import { GasFeeEstimates } from '@metamask/gas-fee-controller';
import BigNumber from 'bignumber.js';
import BN from 'bnjs4';
import { GasTransaction } from '../TransactionReview/TransactionReviewEIP1559Update/types';

export interface ExistingGas {
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
}

export type UpdateEIP1559GasTransaction = GasTransaction & {
  error?: string;
};

export interface UpdateEIP1559OwnProps {
  /**
   * Chain Id
   */
  chainId: string;
  /**
   * A bool indicates whether tx is speed up/cancel
   */
  isCancel: boolean;
  /**
   * The max fee and max priorty fee selected tx
   */
  existingGas: ExistingGas;
  /**
   * Gas object used to get suggestedGasLimit
   */
  gas: string | number | BN;
  /**
   * Function that cancels the tx update
   */
  onCancel: () => void;
  /**
   * Function that performs the rest of the tx update
   */
  onSave: (tx: UpdateEIP1559GasTransaction) => void;
}

export interface UpdateEIP1559StateProps {
  /**
   * Map of accounts to information objects including balances
   */
  accounts: Record<string, AccountInformation>;
  /**
   * ETH or fiat, depending on user setting
   */
  primaryCurrency: string;
  /**
   * Gas fee estimates returned by the gas fee controller
   */
  gasFeeEstimates: GasFeeEstimates;
  /**
   * Estimate type returned by the gas fee controller, can be market-fee, legacy or eth_gasPrice
   */
  gasEstimateType: string;
  /**
   * A string that represents the selected address
   */
  selectedAddress: string;
  /**
   * Current provider ticker
   */
  ticker: string;
}

export type UpdateEIP1559Props = UpdateEIP1559OwnProps & UpdateEIP1559StateProps;

export interface UpdateTx1559Options {
  /**
   * The legacy calculated max priorty fee used in subcomponent for threshold warning messages
   */
  maxPriortyFeeThreshold: BigNumber | string;
  /**
   * The legacy calculated max fee used in subcomponent for threshold warning messages
   */
  maxFeeThreshold: BigNumber | string;
  /**
   * Boolean to indicate to sumcomponent if the view should display only advanced settings
   */
  showAdvanced: boolean;
  /**
   * Boolean to indicate if this is a cancel tx update
   */
  isCancel: boolean;
}
