import type BN from 'bnjs4';
import { SecurityAlertResponse } from '@metamask/transaction-controller';
import type { TransactionAssetType } from '../../../../../../actions/transaction';

/**
 * Asset selected for the transaction in the `transaction` redux slice.
 */
export interface SelectedAsset {
  isETH: boolean;
  tokenId?: string;
  address: string;
  symbol: string;
  decimals: number;
  image?: string;
  name?: string;
  standard?: string;
}

/**
 * Raw transaction params of the `transaction` redux slice, as populated while
 * a transaction is being confirmed.
 */
export interface TransactionParams {
  data?: string;
  from: string;
  gas: BN;
  gasPrice: BN;
  to: string;
  value: BN;
  maxFeePerGas?: BN;
  maxPriorityFeePerGas?: BN;
  securityAlertResponse?: SecurityAlertResponse;
}

/**
 * Shape of the `transaction` redux slice (see `app/reducers/transaction`).
 */
export interface TransactionState {
  ensRecipient?: string;
  assetType?: TransactionAssetType;
  selectedAsset: SelectedAsset;
  transaction: TransactionParams;
  warningGasPriceHigh?: string;
  transactionTo: string;
  transactionToName: string;
  transactionFromName: string;
  transactionValue?: string;
  symbol?: string;
  paymentRequest?: boolean;
  readableValue?: string;
  id?: string;
  type?: string;
  proposedNonce?: number;
  nonce?: number;
  securityAlertResponses: Record<string, SecurityAlertResponse>;
  useMax?: boolean;
  maxValueMode?: boolean;
  origin?: string;
  chainId?: string;
  networkClientId?: string;
}
