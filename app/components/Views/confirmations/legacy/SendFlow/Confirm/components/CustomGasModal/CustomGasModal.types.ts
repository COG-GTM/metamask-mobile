export interface TransactionParams {
  data?: string;
  from?: string;
  to?: string;
  value?: string;
  gas?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
}

export interface GasTransaction {
  error?: string;
  gasFeeMaxHex: string;
  totalHex?: string;
  totalMaxHex?: string;
  suggestedGasLimit?: string;
  [key: string]: unknown;
}

export interface GasOption {
  suggestedMaxFeePerGas?: string;
  suggestedMaxPriorityFeePerGas?: string;
  suggestedGasLimit?: string;
}

export interface GasObject {
  legacyGasLimit?: string;
  suggestedGasPrice?: string;
  suggestedMaxFeePerGas?: string;
  suggestedMaxPriorityFeePerGas?: string;
  suggestedGasLimit?: string;
  [key: string]: unknown;
}

export interface CustomGasModalProps {
  gasSelected: string;
  animateOnChange?: boolean;
  isAnimating: boolean;
  onlyGas: boolean;
  validateAmount: ({
    transaction,
    total,
  }: {
    transaction: TransactionParams;
    total?: string;
  }) => string;
  legacy: boolean;
  legacyGasData?: {
    legacyGasLimit?: string;
    suggestedGasPrice?: string;
  };
  EIP1559GasData?: GasObject & {
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
    suggestedMaxFeePerGas?: string;
    suggestedMaxPriorityFeePerGas?: string;
    suggestedGasLimit?: string;
    [key: string]: unknown;
  };
  EIP1559GasTxn?: Partial<GasTransaction> & {
    suggestedGasLimit?: string;
    totalMaxHex?: string;
  };
  onGasChanged: (gas: string) => void;
  onGasCanceled: (gas: string) => void;
  updateGasState: (state: {
    gasTxn: GasTransaction;
    gasObj: GasObject;
    gasSelect?: string;
    txnType: boolean;
  }) => void;
}
