import { SecurityAlertResponse } from '../../components/Views/confirmations/legacy/components/BlockaidBanner/BlockaidBanner.types';

/**
 * Asset types supported in transactions
 */
export type AssetType = 'ETH' | 'ERC20' | 'ERC721';

/**
 * Selected asset for a transaction
 */
export interface SelectedAsset {
  address?: string;
  decimals?: number;
  image?: string;
  name?: string;
  symbol?: string;
  tokenId?: string;
  isETH?: boolean;
  standard?: string;
}

/**
 * Transaction data object
 */
export interface TransactionData {
  data?: string;
  from?: string;
  gas?: string;
  gasPrice?: string;
  to?: string;
  value?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
}

/**
 * Security alert responses mapped by transaction ID
 */
export type SecurityAlertResponses = Record<string, SecurityAlertResponse>;

/**
 * Transaction reducer state
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
  securityAlertResponses: SecurityAlertResponses;
  useMax?: boolean;
  maxValueMode?: boolean;
}
