import { type Action } from 'redux';
import { SecurityAlertResponse } from '../../components/Views/confirmations/legacy/components/BlockaidBanner/BlockaidBanner.types';

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

export type ResetTransactionAction = Action<TransactionActionType.RESET_TRANSACTION>;

export type NewAssetTransactionAction = Action<TransactionActionType.NEW_ASSET_TRANSACTION> & {
  selectedAsset: Record<string, unknown>;
  assetType: string;
};

export type SetNonceAction = Action<TransactionActionType.SET_NONCE> & {
  nonce: string | undefined;
};

export type SetProposedNonceAction = Action<TransactionActionType.SET_PROPOSED_NONCE> & {
  proposedNonce: string | undefined;
};

export type SetRecipientAction = Action<TransactionActionType.SET_RECIPIENT> & {
  from: string | undefined;
  to: string | undefined;
  ensRecipient: string | undefined;
  transactionToName: string | undefined;
  transactionFromName: string | undefined;
};

export type SetSelectedAssetAction = Action<TransactionActionType.SET_SELECTED_ASSET> & {
  selectedAsset: Record<string, unknown>;
  assetType?: string;
};

export type PrepareTransactionAction = Action<TransactionActionType.PREPARE_TRANSACTION> & {
  transaction: Record<string, unknown>;
};

export type SetTransactionObjectAction = Action<TransactionActionType.SET_TRANSACTION_OBJECT> & {
  transaction: Record<string, unknown>;
};

export type SetTokensTransactionAction = Action<TransactionActionType.SET_TOKENS_TRANSACTION> & {
  asset: Record<string, unknown>;
};

export type SetEtherTransactionAction = Action<TransactionActionType.SET_ETHER_TRANSACTION> & {
  transaction: Record<string, unknown>;
};

export type SetTransactionSecurityAlertResponseAction = Action<TransactionActionType.SET_TRANSACTION_SECURITY_ALERT_RESPONSE> & {
  transactionId: string;
  securityAlertResponse: SecurityAlertResponse;
};

export type SetTransactionIdAction = Action<TransactionActionType.SET_TRANSACTION_ID> & {
  transactionId: string;
};

export type SetMaxValueModeAction = Action<TransactionActionType.SET_MAX_VALUE_MODE> & {
  maxValueMode: boolean;
};

export type SetTransactionValueAction = Action<TransactionActionType.SET_TRANSACTION_VALUE> & {
  value: string;
};

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
  | SetTransactionValueAction;
