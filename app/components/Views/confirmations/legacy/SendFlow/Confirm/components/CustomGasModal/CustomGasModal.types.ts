export interface CustomGasModalProps {
  gasSelected: string;
  onChange?: (gas: string) => void;
  onCancel?: () => void;
  animateOnChange?: boolean;
  isAnimating?: boolean;
  onlyGas: boolean;
  validateAmount: ({
    transaction,
    total,
  }: {
    transaction: unknown;
    total?: string;
  }) => string;
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
    gasTxn: unknown;
    gasObj: unknown;
    gasSelect?: string;
    txnType: boolean;
  }) => void;
}
