/**
 * Transaction-related type definitions for MetaMask Mobile
 */

import type { TransactionMeta } from '@metamask/transaction-controller';

/**
 * Transaction action keys used in transaction review and list
 */
export type TransactionActionKey =
  | 'transfer'
  | 'transferfrom'
  | 'approve'
  | 'increaseAllowance'
  | 'setapprovalforall'
  | 'deploy'
  | 'sentEther'
  | 'smartContractInteraction'
  | 'swapsTransaction'
  | 'bridgeTransaction'
  | 'unknownFunction';

/**
 * Transaction types for categorization
 */
export type TransactionCategory =
  | 'transaction_approve'
  | 'transaction_increase_allowance'
  | 'transaction_set_approval_for_all'
  | 'transaction_received'
  | 'transaction_received_collectible'
  | 'transaction_received_token'
  | 'transaction_sent'
  | 'transaction_sent_collectible'
  | 'transaction_sent_token'
  | 'transaction_site_interaction'
  | 'swaps_transaction'
  | 'bridge_transaction';

/**
 * Options for generating transfer data
 */
export interface TransferDataOptions {
  toAddress?: string;
  fromAddress?: string;
  amount?: string;
  tokenId?: string;
}

/**
 * Options for generating approval data
 */
export interface ApprovalDataOptions {
  spender: string | null;
  value: string;
  data?: string;
}

/**
 * Decoded approval data
 */
export interface DecodedApprovalData {
  spenderAddress: string;
  encodedAmount: string;
}

/**
 * Method data returned from getMethodData
 */
export interface MethodData {
  name?: string;
}

/**
 * Configuration for getTransactionToName
 */
export interface TransactionToNameConfig {
  addressBook: Record<string, Record<string, { name: string }>>;
  chainId: string;
  toAddress: string;
  internalAccounts: {
    address: string;
    metadata: { name: string };
  }[];
  ensRecipient?: string;
}

/**
 * EIP-1559 gas fee parameters
 */
export interface EIP1559GasFeeParams {
  suggestedMaxPriorityFeePerGas: string;
  suggestedMaxFeePerGas: string;
  estimatedBaseFee?: string;
  suggestedGasLimit: string;
  suggestedEstimatedGasLimit?: string;
  selectedOption?: string;
  recommended?: string;
}

/**
 * EIP-1559 gas fee hex values
 */
export interface EIP1559GasFeeHexes {
  estimatedBaseFee_PLUS_suggestedMaxPriorityFeePerGasHex: string;
  maxPriorityFeePerGasTimesGasLimitHex: string;
  gasFeeMinHex: string;
  gasFeeMaxHex: string;
}

/**
 * Time estimate result from calculateEIP1559Times
 */
export interface TimeEstimateResult {
  timeEstimate: string;
  timeEstimateColor: string;
  timeEstimateId?: string;
}

/**
 * Browser state for getActiveTabUrl
 */
export interface BrowserState {
  tabs?: { id: string; url: string }[];
  activeTab?: string;
}

/**
 * Extended transaction meta with additional properties
 */
export interface ExtendedTransactionMeta extends TransactionMeta {
  isTransfer?: boolean;
  transferInformation?: {
    contractAddress: string;
    decimals: number;
    symbol: string;
  };
  toSmartContract?: boolean;
}
