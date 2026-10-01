export interface GasTxn {
  error?: string;
  totalHex?: string;
  totalMaxHex?: string;
  suggestedGasLimit?: string;
  [key: string]: unknown;
}

export interface GasObj {
  legacyGasLimit?: string;
  suggestedGasPrice?: string;
  suggestedMaxFeePerGas?: string;
  suggestedMaxPriorityFeePerGas?: string;
  suggestedGasLimit?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
}

export interface CustomGasModalProps {
  gasSelected: string;
  onChange?: (gas: string) => void;
  onCancel?: () => void;
  animateOnChange?: boolean;
  isAnimating: boolean;
  onlyGas: boolean;
  validateAmount: ({
    transaction,
    total,
  }: {
    transaction: unknown;
    total: string | undefined;
  }) => string | undefined;
  legacy: boolean;
  legacyGasData?: {
    legacyGasLimit: string;
    suggestedGasPrice: string;
  };
  EIP1559GasData?: {
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
    suggestedMaxFeePerGas: string;
    suggestedMaxPriorityFeePerGas: string;
    suggestedGasLimit: string;
  };
  EIP1559GasTxn?: {
    suggestedGasLimit: string;
    totalMaxHex: string;
  };
  onGasChanged: (gas: string) => void;
  onGasCanceled: (gas: string) => void;
  updateGasState: (state: {
    gasTxn: GasTxn;
    gasObj: GasObj;
    gasSelect?: string;
    txnType: boolean;
  }) => void;
}
