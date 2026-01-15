import type BN from 'bnjs4';
import type { SecurityAlertResponse as TransactionControllerSecurityAlertResponse } from '@metamask/transaction-controller';

/**
 * Security alert response - extends the base type to allow additional properties
 */
export type SecurityAlertResponse = TransactionControllerSecurityAlertResponse & {
  [key: string]: unknown;
};

/**
 * Transaction data
 */
export interface TransactionData {
  data?: string;
  from?: string;
  gas?: string | BN;
  gasPrice?: string | BN;
  to?: string;
  value?: string | BN;
  // eip1559
  maxFeePerGas?: string | BN;
  maxPriorityFeePerGas?: string | BN;
  securityAlertResponse?: SecurityAlertResponse;
}

/**
 * Selected asset
 */
export interface SelectedAsset {
  tokenId?: string;
  isETH?: boolean;
  symbol?: string;
  address?: string;
  decimals?: number;
  image?: string;
  name?: string;
  standard?: string;
  [key: string]: unknown;
}

/**
 * Asset type
 */
export type AssetType = 'ETH' | 'ERC20' | 'ERC721' | undefined;


/**
 * Transaction state
 */
export interface TransactionState {
  ensRecipient?: string;
  assetType?: AssetType;
  selectedAsset: SelectedAsset;
  transaction: TransactionData;
  warningGasPriceHigh?: string;
  transactionTo?: string;
  transactionToName?: string;
  transactionFromName?: string;
  transactionValue?: string;
  symbol?: string;
  paymentRequest?: unknown;
  readableValue?: string;
  id?: string;
  type?: string;
  proposedNonce?: string;
  nonce?: string;
  securityAlertResponses: Record<string, SecurityAlertResponse>;
  useMax?: boolean;
  maxValueMode?: boolean;
  // Allow additional properties for flexibility with test mocks and future extensions
  [key: string]: unknown;
}
