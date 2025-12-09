import { type Action } from 'redux';
import { type SecurityAlertResponse } from '../../components/Views/confirmations/legacy/components/BlockaidBanner/BlockaidBanner.types';
import type BN from 'bnjs4';

/**
 * Asset types for transactions
 */
export enum AssetType {
  ETH = 'ETH',
  ERC20 = 'ERC20',
  ERC721 = 'ERC721',
  ERC1155 = 'ERC1155',
}

/**
 * Transaction action type enum
 */
export enum TransactionActionType {
  RESET_TRANSACTION = 'RESET_TRANSACTION',
  NEW_ASSET_TRANSACTION = 'NEW_ASSET_TRANSACTION',
  SET_NONCE = 'SET_NONCE',
  SET_PROPOSED_NONCE = 'SET_PROPOSED_NONCE',
  SET_RECIPIENT = 'SET_RECIPIENT',
  SET_SELECTED_ASSET = 'SET_SELECTED_ASSET',
  PREPARE_TRANSACTION = 'PREPARE_TRANSACTION',
  SET_TRANSACTION_OBJECT = 'SET_TRANSACTION_OBJECT',
  SET_TOKENS_TRANSACTION = 'SET_TOKENS_TRANSACTION',
  SET_ETHER_TRANSACTION = 'SET_ETHER_TRANSACTION',
  SET_TRANSACTION_SECURITY_ALERT_RESPONSE = 'SET_TRANSACTION_SECURITY_ALERT_RESPONSE',
  SET_TRANSACTION_ID = 'SET_TRANSACTION_ID',
  SET_MAX_VALUE_MODE = 'SET_MAX_VALUE_MODE',
  SET_TRANSACTION_VALUE = 'SET_TRANSACTION_VALUE',
}

/**
 * Selected asset interface
 */
export interface SelectedAsset {
  isETH?: boolean;
  tokenId?: string;
  symbol?: string;
  address?: string;
  decimals?: number;
  image?: string;
  name?: string;
  standard?: string;
}

/**
 * Transaction data interface
 */
export interface TransactionData {
  data?: string;
  from?: string;
  gas?: BN;
  gasPrice?: BN;
  to?: string;
  value?: BN;
  maxFeePerGas?: BN;
  maxPriorityFeePerGas?: BN;
}

/**
 * Transaction object interface for SET_TRANSACTION_OBJECT action
 */
export interface TransactionObject extends TransactionData {
  selectedAsset?: SelectedAsset;
  assetType?: AssetType;
  ensRecipient?: string;
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
}

/**
 * Transaction actions
 */
export type ResetTransactionAction = Action<TransactionActionType.RESET_TRANSACTION>;

export interface NewAssetTransactionAction extends Action<TransactionActionType.NEW_ASSET_TRANSACTION> {
  selectedAsset: SelectedAsset;
  assetType: AssetType;
}

export interface SetNonceAction extends Action<TransactionActionType.SET_NONCE> {
  nonce: string;
}

export interface SetProposedNonceAction extends Action<TransactionActionType.SET_PROPOSED_NONCE> {
  proposedNonce: string;
}

export interface SetRecipientAction extends Action<TransactionActionType.SET_RECIPIENT> {
  from: string;
  to: string;
  ensRecipient?: string;
  transactionToName?: string;
  transactionFromName?: string;
}

export interface SetSelectedAssetAction extends Action<TransactionActionType.SET_SELECTED_ASSET> {
  selectedAsset: SelectedAsset;
  assetType?: AssetType;
}

export interface PrepareTransactionAction extends Action<TransactionActionType.PREPARE_TRANSACTION> {
  transaction: TransactionData;
}

export interface SetTransactionObjectAction extends Action<TransactionActionType.SET_TRANSACTION_OBJECT> {
  transaction: TransactionObject;
}

export interface SetTokensTransactionAction extends Action<TransactionActionType.SET_TOKENS_TRANSACTION> {
  asset: SelectedAsset;
}

export interface SetEtherTransactionAction extends Action<TransactionActionType.SET_ETHER_TRANSACTION> {
  transaction: TransactionObject;
}

export interface SetTransactionSecurityAlertResponseAction extends Action<TransactionActionType.SET_TRANSACTION_SECURITY_ALERT_RESPONSE> {
  transactionId: string;
  securityAlertResponse: SecurityAlertResponse;
}

export interface SetTransactionIdAction extends Action<TransactionActionType.SET_TRANSACTION_ID> {
  transactionId: string;
}

export interface SetMaxValueModeAction extends Action<TransactionActionType.SET_MAX_VALUE_MODE> {
  maxValueMode: boolean;
}

export interface SetTransactionValueAction extends Action<TransactionActionType.SET_TRANSACTION_VALUE> {
  value: string;
}

/**
 * Rehydrate action from redux-persist
 */
export interface RehydrateAction {
  type: 'persist/REHYDRATE';
}

/**
 * Transaction actions union type
 */
export type TransactionAction =
  | ResetTransactionAction
  | NewAssetTransactionAction
  | SetNonceAction
  | SetProposedNonceAction
  | SetRecipientAction
  | SetSelectedAssetAction
  | PrepareTransactionAction
  | SetTransactionObjectAction
  | SetTokensTransactionAction
  | SetEtherTransactionAction
  | SetTransactionSecurityAlertResponseAction
  | SetTransactionIdAction
  | SetMaxValueModeAction
  | SetTransactionValueAction
  | RehydrateAction;
