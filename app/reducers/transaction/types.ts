import { type SecurityAlertResponse } from '@metamask/transaction-controller';
import type BN from 'bnjs4';
import { type AssetType, type SelectedAsset } from '../../actions/transaction/types';

/**
 * Transaction data in state
 * Note: value can be either BN or string depending on the action that sets it
 */
export interface TransactionStateData {
  data?: string;
  from?: string;
  gas?: BN;
  gasPrice?: BN;
  to?: string;
  value?: BN | string;
  maxFeePerGas?: BN;
  maxPriorityFeePerGas?: BN;
}

/**
 * Transaction state interface
 */
export interface TransactionState {
  ensRecipient?: string;
  assetType?: AssetType;
  selectedAsset: SelectedAsset;
  transaction: TransactionStateData;
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
  useMax: boolean;
  maxValueMode?: boolean;
}
