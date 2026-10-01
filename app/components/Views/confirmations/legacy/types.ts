import type { Hex } from '@metamask/utils';
import type { TransactionMeta } from '@metamask/transaction-controller';

/**
 * Shape of the legacy SendFlow transaction object stored on `state.transaction`.
 * Mirrors the Redux state defined in `app/reducers/transaction/index.js`.
 */
export interface LegacyTransactionParams {
  data?: string;
  from?: string;
  gas?: string;
  gasPrice?: string;
  to?: string;
  value?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  estimatedBaseFee?: string;
  nonce?: string;
  chainId?: Hex | string;
  type?: string;
}

export interface SelectedAsset {
  address?: string;
  symbol?: string;
  decimals?: number | string;
  image?: string;
  isETH?: boolean;
  logo?: string;
  name?: string;
  tokenId?: string;
  standard?: string;
  balance?: string;
  iconUrl?: string;
}

export interface LegacyTransactionState {
  ensRecipient?: string;
  assetType?: string;
  selectedAsset: SelectedAsset;
  transaction: LegacyTransactionParams;
  warningGasPriceHigh?: string;
  transactionTo?: string;
  transactionToName?: string;
  transactionFromName?: string;
  transactionValue?: string;
  symbol?: string;
  paymentRequest?: boolean;
  readableValue?: string;
  id?: string;
  type?: string;
  proposedNonce?: number;
  nonce?: number;
  securityAlertResponses?: Record<string, unknown>;
  useMax?: boolean;
}

/**
 * Shape of the alert action payload accepted by `showAlert`.
 */
export interface ShowAlertConfig {
  isVisible: boolean;
  autodismiss?: number;
  content: string;
  data?: { msg?: string; title?: string; [key: string]: unknown };
}

/**
 * Gas selected option keys.
 */
export type GasSelected = 'low' | 'medium' | 'high' | string | null;

/**
 * Page metadata for an origin requesting a confirmation.
 */
export interface CurrentPageInformation {
  url: string;
  icon?: string;
  title?: string;
  metamaskId?: string;
  [key: string]: unknown;
}

/**
 * Re-export `TransactionMeta` to ease typing transaction objects across legacy
 * confirmations screens.
 */
export type { TransactionMeta };
