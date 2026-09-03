import BigNumber from 'bignumber.js';
import { GasTransactionProps } from '../../../../../../core/GasPolling/types';
import { selectAccounts } from '../../../../../../selectors/accountTrackerController';
import type { selectGasFeeEstimates } from '../../../../../../selectors/confirmTransaction';

export interface UpdateEIP1559Props {
  /**
   * Map of accounts to information objects including balances
   */
  accounts: ReturnType<typeof selectAccounts>;
  /**
   * Chain Id
   */
  chainId: string;
  /**
   * ETH or fiat, depending on user setting
   */
  primaryCurrency: string;
  /**
   * Gas fee estimates returned by the gas fee controller
   */
  gasFeeEstimates: Extract<
    ReturnType<typeof selectGasFeeEstimates>,
    {
      medium: {
        suggestedMaxFeePerGas: string;
        suggestedMaxPriorityFeePerGas: string;
      };
    }
  >;
  /**
   * Estimate type returned by the gas fee controller, can be market-fee, legacy or eth_gasPrice
   */
  gasEstimateType: string;
  /**
   * A string that represents the selected address
   */
  selectedAddress: string | undefined;
  /**
   * A bool indicates whether tx is speed up/cancel
   */
  isCancel: boolean;
  /**
   * Current provider ticker
   */
  ticker: string | undefined;
  /**
   * The max fee and max priorty fee selected tx
   */
  existingGas: {
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
  };
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
  onSave: (tx: GasTransactionProps) => void;
}

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
