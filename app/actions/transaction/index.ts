import { type Action } from 'redux';
import TransactionTypes from '../../core/TransactionTypes';

const {
  ASSET: { ETH, ERC20, ERC721 },
} = TransactionTypes;

/**
 * Transaction action type enum
 */
export enum TransactionActionType {
  RESET_TRANSACTION = 'RESET_TRANSACTION',
  NEW_ASSET_TRANSACTION = 'NEW_ASSET_TRANSACTION',
  SET_RECIPIENT = 'SET_RECIPIENT',
  SET_SELECTED_ASSET = 'SET_SELECTED_ASSET',
  PREPARE_TRANSACTION = 'PREPARE_TRANSACTION',
  SET_TRANSACTION_SECURITY_ALERT_RESPONSE = 'SET_TRANSACTION_SECURITY_ALERT_RESPONSE',
  SET_TRANSACTION_OBJECT = 'SET_TRANSACTION_OBJECT',
  SET_TRANSACTION_ID = 'SET_TRANSACTION_ID',
  SET_TOKENS_TRANSACTION = 'SET_TOKENS_TRANSACTION',
  SET_ETHER_TRANSACTION = 'SET_ETHER_TRANSACTION',
  SET_NONCE = 'SET_NONCE',
  SET_PROPOSED_NONCE = 'SET_PROPOSED_NONCE',
  SET_MAX_VALUE_MODE = 'SET_MAX_VALUE_MODE',
  SET_TRANSACTION_VALUE = 'SET_TRANSACTION_VALUE',
}

export type ResetTransactionAction =
  Action<TransactionActionType.RESET_TRANSACTION>;

export interface NewAssetTransactionAction
  extends Action<TransactionActionType.NEW_ASSET_TRANSACTION> {
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selectedAsset: any;
  assetType: string;
}

export interface SetRecipientAction
  extends Action<TransactionActionType.SET_RECIPIENT> {
  from: string;
  to: string;
  ensRecipient: string;
  transactionToName: string;
  transactionFromName: string;
}

export interface SetSelectedAssetAction
  extends Action<TransactionActionType.SET_SELECTED_ASSET> {
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selectedAsset: any;
  assetType: string;
}

export interface PrepareTransactionAction
  extends Action<TransactionActionType.PREPARE_TRANSACTION> {
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transaction: any;
}

export interface SetTransactionSecurityAlertResponseAction
  extends Action<TransactionActionType.SET_TRANSACTION_SECURITY_ALERT_RESPONSE> {
  transactionId: string;
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  securityAlertResponse: any;
}

export interface SetTransactionObjectAction
  extends Action<TransactionActionType.SET_TRANSACTION_OBJECT> {
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transaction: any;
}

export interface SetTransactionIdAction
  extends Action<TransactionActionType.SET_TRANSACTION_ID> {
  transactionId: string;
}

export interface SetTokensTransactionAction
  extends Action<TransactionActionType.SET_TOKENS_TRANSACTION> {
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  asset: any;
}

export interface SetEtherTransactionAction
  extends Action<TransactionActionType.SET_ETHER_TRANSACTION> {
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transaction: any;
}

export interface SetNonceAction
  extends Action<TransactionActionType.SET_NONCE> {
  nonce: string;
}

export interface SetProposedNonceAction
  extends Action<TransactionActionType.SET_PROPOSED_NONCE> {
  proposedNonce: string;
}

export interface SetMaxValueModeAction
  extends Action<TransactionActionType.SET_MAX_VALUE_MODE> {
  maxValueMode: boolean;
}

export interface SetTransactionValueAction
  extends Action<TransactionActionType.SET_TRANSACTION_VALUE> {
  value: string;
}

/**
 * Union type for all transaction actions
 */
export type TransactionAction =
  | ResetTransactionAction
  | NewAssetTransactionAction
  | SetRecipientAction
  | SetSelectedAssetAction
  | PrepareTransactionAction
  | SetTransactionSecurityAlertResponseAction
  | SetTransactionObjectAction
  | SetTransactionIdAction
  | SetTokensTransactionAction
  | SetEtherTransactionAction
  | SetNonceAction
  | SetProposedNonceAction
  | SetMaxValueModeAction
  | SetTransactionValueAction;

/**
 * Clears transaction object completely
 */
export function resetTransaction(): ResetTransactionAction {
  return {
    type: TransactionActionType.RESET_TRANSACTION,
  };
}

/**
 * Starts a new transaction state with an asset
 *
 * @param selectedAsset - Asset to start the transaction with
 */
// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function newAssetTransaction(selectedAsset: any): NewAssetTransactionAction {
  return {
    type: TransactionActionType.NEW_ASSET_TRANSACTION,
    selectedAsset,
    assetType: selectedAsset.isETH
      ? ETH
      : selectedAsset.tokenId
      ? ERC721
      : ERC20,
  };
}

/**
 * Sets transaction to address and ensRecipient in case is available
 *
 * @param from - Address to send the transaction from
 * @param to - Address to send the transaction to
 * @param ensRecipient - Resolved ens name to send the transaction to
 * @param transactionToName - Resolved address book name for to address
 * @param transactionFromName - Resolved address book name for from address
 */
export function setRecipient(
  from: string,
  to: string,
  ensRecipient: string,
  transactionToName: string,
  transactionFromName: string,
): SetRecipientAction {
  return {
    type: TransactionActionType.SET_RECIPIENT,
    from,
    to,
    ensRecipient,
    transactionToName,
    transactionFromName,
  };
}

/**
 * Sets asset as selectedAsset
 *
 * @param selectedAsset - Asset to start the transaction with
 */
// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setSelectedAsset(selectedAsset: any): SetSelectedAssetAction {
  return {
    type: TransactionActionType.SET_SELECTED_ASSET,
    selectedAsset,
    assetType: selectedAsset.isETH
      ? ETH
      : selectedAsset.tokenId
      ? ERC721
      : ERC20,
  };
}

/**
 * Sets transaction object to be sent
 *
 * @param transaction - Transaction object with from, to, data, gas, gasPrice, value
 */
// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function prepareTransaction(transaction: any): PrepareTransactionAction {
  return {
    type: TransactionActionType.PREPARE_TRANSACTION,
    transaction,
  };
}

export function setTransactionSecurityAlertResponse(
  transactionId: string,
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  securityAlertResponse: any,
): SetTransactionSecurityAlertResponseAction {
  return {
    type: TransactionActionType.SET_TRANSACTION_SECURITY_ALERT_RESPONSE,
    transactionId,
    securityAlertResponse,
  };
}

/**
 * Sets any attribute in transaction object
 *
 * @param transaction - New transaction object
 */
// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setTransactionObject(transaction: any): SetTransactionObjectAction {
  return {
    type: TransactionActionType.SET_TRANSACTION_OBJECT,
    transaction,
  };
}

/**
 * Sets the current transaction ID only.
 *
 * @param transactionId - Id of the current transaction.
 */
export function setTransactionId(transactionId: string): SetTransactionIdAction {
  return {
    type: TransactionActionType.SET_TRANSACTION_ID,
    transactionId,
  };
}

/**
 * Enable selectable tokens (ERC20 and Ether) to send in a transaction
 *
 * @param asset - Asset to start the transaction with
 */
// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setTokensTransaction(asset: any): SetTokensTransactionAction {
  return {
    type: TransactionActionType.SET_TOKENS_TRANSACTION,
    asset,
  };
}

/**
 * Enable Ether only to send in a transaction
 *
 * @param transaction - Transaction additional object
 */
// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setEtherTransaction(transaction: any): SetEtherTransactionAction {
  return {
    type: TransactionActionType.SET_ETHER_TRANSACTION,
    transaction,
  };
}

export function setNonce(nonce: string): SetNonceAction {
  return {
    type: TransactionActionType.SET_NONCE,
    nonce,
  };
}

export function setProposedNonce(proposedNonce: string): SetProposedNonceAction {
  return {
    type: TransactionActionType.SET_PROPOSED_NONCE,
    proposedNonce,
  };
}

export function setMaxValueMode(maxValueMode: boolean): SetMaxValueModeAction {
  return {
    type: TransactionActionType.SET_MAX_VALUE_MODE,
    maxValueMode,
  };
}

export function setTransactionValue(value: string): SetTransactionValueAction {
  return {
    type: TransactionActionType.SET_TRANSACTION_VALUE,
    value,
  };
}
