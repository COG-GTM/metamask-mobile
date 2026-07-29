import { Hex } from '@metamask/utils';
import { LegacyGasObject } from '../../../../components/EditGasFeeLegacyUpdate/types';
import { GasTransaction } from '../../../../components/TransactionReview/TransactionReviewEIP1559Update/types';

/**
 * Slice of the transaction reducer read by the send flow gas modal.
 */
export interface SendFlowTransaction {
  chainId?: Hex;
  selectedAsset?: {
    symbol?: string;
  };
  transaction?: {
    data?: string;
    from?: string;
  };
}

export interface EIP1559GasObject {
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  suggestedMaxFeePerGas?: string;
  suggestedMaxPriorityFeePerGas?: string;
  suggestedGasLimit?: string;
}

export interface CustomGasModalProps {
  gasSelected: string;
  onChange?: (gas: string) => void;
  onCancel?: () => void;
  animateOnChange?: boolean;
  isAnimating: boolean;
  onlyGas: boolean;
  validateAmount: (params: {
    transaction: SendFlowTransaction;
    total?: string;
  }) => string | undefined;
  legacy: boolean;
  legacyGasData?: LegacyGasObject;
  EIP1559GasData?: EIP1559GasObject;
  EIP1559GasTxn?: GasTransaction;
  onGasChanged: (gas: string) => void;
  onGasCanceled: (gas: string) => void;
  updateGasState: (state: {
    gasTxn: GasTransaction;
    gasObj?: LegacyGasObject | EIP1559GasObject;
    gasSelect?: string;
    txnType: boolean;
  }) => void;
}
