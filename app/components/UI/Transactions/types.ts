/**
 * Loose shapes for the legacy transaction data flowing through the activity
 * list components. They only describe the fields these components read, and
 * keep an index signature for the remaining controller-provided fields.
 */
export interface TransactionMetaLike {
  id: string;
  time?: number;
  chainId?: string;
  status?: string;
  txParams?: {
    from?: string;
    to?: string;
    gas?: string;
    gasPrice?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
    nonce?: string;
    value?: string;
    [key: string]: unknown;
  };
  speedUpParams?: { type?: string; [key: string]: unknown };
  insertImportTime?: boolean;
  [key: string]: unknown;
}

/** Gas information of an existing transaction being sped up or cancelled. */
export interface ExistingGasLike {
  isEIP1559Transaction?: boolean;
  gasPrice?: string;
  suggestedMaxFeePerGas?: string;
  suggestedMaxPriorityFeePerGas?: string;
  [key: string]: unknown;
}

/** Navigation surface used by the activity list components. */
export interface TransactionsNavigation {
  push: (...args: unknown[]) => void;
  navigate: (...args: unknown[]) => void;
}
