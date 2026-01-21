import type BN from 'bnjs4';

export interface TransactionData {
  data?: string;
  from?: string;
  gas?: string | BN;
  gasPrice?: string | BN;
  to?: string;
  value?: string | BN;
  maxFeePerGas?: string | BN;
  maxPriorityFeePerGas?: string | BN;
}

export interface SelectedAsset {
  tokenId?: string;
  isETH?: boolean;
  symbol?: string;
  address?: string;
  decimals?: number;
  image?: string;
  name?: string;
}

export type AssetType = 'ETH' | 'ERC20' | 'ERC721' | string | undefined;

export interface SecurityAlertResponse {
  result_type?: string;
  reason?: string;
  features?: string[];
  block?: number;
  req?: Record<string, unknown>;
  chainId?: string;
  providerRequestsCount?: Record<string, unknown>;
}

export interface TransactionState {
  ensRecipient?: string;
  assetType: AssetType;
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
}
