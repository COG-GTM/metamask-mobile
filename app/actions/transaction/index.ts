import TransactionTypes from '../../core/TransactionTypes';
import { SecurityAlertResponse } from '../../components/Views/confirmations/legacy/components/BlockaidBanner/BlockaidBanner.types';

const {
  ASSET: { ETH, ERC20, ERC721 },
} = TransactionTypes;

export const RESET_TRANSACTION = 'RESET_TRANSACTION';
export const NEW_ASSET_TRANSACTION = 'NEW_ASSET_TRANSACTION';
export const SET_RECIPIENT = 'SET_RECIPIENT';
export const SET_SELECTED_ASSET = 'SET_SELECTED_ASSET';
export const PREPARE_TRANSACTION = 'PREPARE_TRANSACTION';
export const SET_TRANSACTION_SECURITY_ALERT_RESPONSE =
  'SET_TRANSACTION_SECURITY_ALERT_RESPONSE';
export const SET_TRANSACTION_OBJECT = 'SET_TRANSACTION_OBJECT';
export const SET_TRANSACTION_ID = 'SET_TRANSACTION_ID';
export const SET_TOKENS_TRANSACTION = 'SET_TOKENS_TRANSACTION';
export const SET_ETHER_TRANSACTION = 'SET_ETHER_TRANSACTION';
export const SET_NONCE = 'SET_NONCE';
export const SET_PROPOSED_NONCE = 'SET_PROPOSED_NONCE';
export const SET_MAX_VALUE_MODE = 'SET_MAX_VALUE_MODE';
export const SET_TRANSACTION_VALUE = 'SET_TRANSACTION_VALUE';

/**
 * Minimal shape of an asset used to start or update a transaction
 */
export interface TransactionAsset {
  isETH?: boolean;
  tokenId?: string | number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TransactionObject = Record<string, any>;

export type TransactionAssetType = typeof ETH | typeof ERC20 | typeof ERC721;

export interface ResetTransactionAction {
  type: typeof RESET_TRANSACTION;
}

export interface NewAssetTransactionAction<
  T extends TransactionAsset = TransactionAsset,
> {
  type: typeof NEW_ASSET_TRANSACTION;
  selectedAsset: T;
  assetType: TransactionAssetType;
}

export interface SetRecipientAction {
  type: typeof SET_RECIPIENT;
  from: string;
  to: string;
  ensRecipient?: string;
  transactionToName?: string;
  transactionFromName?: string;
}

export interface SetSelectedAssetAction<
  T extends TransactionAsset = TransactionAsset,
> {
  type: typeof SET_SELECTED_ASSET;
  selectedAsset: T;
  assetType: TransactionAssetType;
}

export interface PrepareTransactionAction {
  type: typeof PREPARE_TRANSACTION;
  transaction: TransactionObject;
}

export interface SetTransactionSecurityAlertResponseAction {
  type: typeof SET_TRANSACTION_SECURITY_ALERT_RESPONSE;
  transactionId?: string;
  securityAlertResponse?: SecurityAlertResponse;
}

export interface SetTransactionObjectAction {
  type: typeof SET_TRANSACTION_OBJECT;
  transaction: TransactionObject;
}

export interface SetTransactionIdAction {
  type: typeof SET_TRANSACTION_ID;
  transactionId: string;
}

export interface SetTokensTransactionAction {
  type: typeof SET_TOKENS_TRANSACTION;
  asset: TransactionObject;
}

export interface SetEtherTransactionAction {
  type: typeof SET_ETHER_TRANSACTION;
  transaction: TransactionObject;
}

export interface SetNonceAction {
  type: typeof SET_NONCE;
  nonce: number | string;
}

export interface SetProposedNonceAction {
  type: typeof SET_PROPOSED_NONCE;
  proposedNonce: number | string;
}

export interface SetMaxValueModeAction {
  type: typeof SET_MAX_VALUE_MODE;
  maxValueMode: boolean;
}

export interface SetTransactionValueAction {
  type: typeof SET_TRANSACTION_VALUE;
  value: string;
}

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
    type: RESET_TRANSACTION,
  };
}

/**
 * Starts a new transaction state with an asset
 *
 * @param {object} selectedAsset - Asset to start the transaction with
 */
export function newAssetTransaction<T extends TransactionAsset>(
  selectedAsset: T,
): NewAssetTransactionAction<T> {
  return {
    type: NEW_ASSET_TRANSACTION,
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
 * @param {string} from - Address to send the transaction from
 * @param {string} to - Address to send the transaction to
 * @param {string} ensRecipient - Resolved ens name to send the transaction to
 * @param {string} transactionToName - Resolved address book name for to address
 * @param {string} transactionFromName - Resolved address book name for from address
 */
export function setRecipient(
  from: string,
  to: string,
  ensRecipient?: string,
  transactionToName?: string,
  transactionFromName?: string,
): SetRecipientAction {
  return {
    type: SET_RECIPIENT,
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
 * @param {object} selectedAsset - Asset to start the transaction with
 */
export function setSelectedAsset<T extends TransactionAsset>(
  selectedAsset: T,
): SetSelectedAssetAction<T> {
  return {
    type: SET_SELECTED_ASSET,
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
 * @param {object} transaction - Transaction object with from, to, data, gas, gasPrice, value
 */
export function prepareTransaction(
  transaction: TransactionObject,
): PrepareTransactionAction {
  return {
    type: PREPARE_TRANSACTION,
    transaction,
  };
}

export function setTransactionSecurityAlertResponse(
  transactionId?: string,
  securityAlertResponse?: SecurityAlertResponse,
): SetTransactionSecurityAlertResponseAction {
  return {
    type: SET_TRANSACTION_SECURITY_ALERT_RESPONSE,
    transactionId,
    securityAlertResponse,
  };
}

/**
 * Sets any attribute in transaction object
 *
 * @param {object} transaction - New transaction object
 */
export function setTransactionObject(
  transaction: TransactionObject,
): SetTransactionObjectAction {
  return {
    type: SET_TRANSACTION_OBJECT,
    transaction,
  };
}

/**
 * Sets the current transaction ID only.
 *
 * @param {object} transactionId - Id of the current transaction.
 */
export function setTransactionId(
  transactionId: string,
): SetTransactionIdAction {
  return {
    type: SET_TRANSACTION_ID,
    transactionId,
  };
}

/**
 * Enable selectable tokens (ERC20 and Ether) to send in a transaction
 *
 * @param {object} asset - Asset to start the transaction with
 */
export function setTokensTransaction(
  asset: TransactionObject,
): SetTokensTransactionAction {
  return {
    type: SET_TOKENS_TRANSACTION,
    asset,
  };
}

/**
 * Enable Ether only to send in a transaction
 *
 * @param {object} transaction - Transaction additional object
 */
export function setEtherTransaction(
  transaction: TransactionObject,
): SetEtherTransactionAction {
  return {
    type: SET_ETHER_TRANSACTION,
    transaction,
  };
}

export function setNonce(nonce: number | string): SetNonceAction {
  return {
    type: SET_NONCE,
    nonce,
  };
}

export function setProposedNonce(
  proposedNonce: number | string,
): SetProposedNonceAction {
  return {
    type: SET_PROPOSED_NONCE,
    proposedNonce,
  };
}

export function setMaxValueMode(maxValueMode: boolean): SetMaxValueModeAction {
  return {
    type: SET_MAX_VALUE_MODE,
    maxValueMode,
  };
}

export function setTransactionValue(value: string): SetTransactionValueAction {
  return {
    type: SET_TRANSACTION_VALUE,
    value,
  };
}
