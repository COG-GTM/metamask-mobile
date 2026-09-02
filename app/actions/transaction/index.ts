import TransactionTypes from '../../core/TransactionTypes';

const {
  ASSET: { ETH, ERC20, ERC721 },
} = TransactionTypes;

export const RESET_TRANSACTION = 'RESET_TRANSACTION' as const;
export const NEW_ASSET_TRANSACTION = 'NEW_ASSET_TRANSACTION' as const;
export const SET_RECIPIENT = 'SET_RECIPIENT' as const;
export const SET_SELECTED_ASSET = 'SET_SELECTED_ASSET' as const;
export const PREPARE_TRANSACTION = 'PREPARE_TRANSACTION' as const;
export const SET_TRANSACTION_SECURITY_ALERT_RESPONSE =
  'SET_TRANSACTION_SECURITY_ALERT_RESPONSE' as const;
export const SET_TRANSACTION_OBJECT = 'SET_TRANSACTION_OBJECT' as const;
export const SET_TRANSACTION_ID = 'SET_TRANSACTION_ID' as const;
export const SET_TOKENS_TRANSACTION = 'SET_TOKENS_TRANSACTION' as const;
export const SET_ETHER_TRANSACTION = 'SET_ETHER_TRANSACTION' as const;
export const SET_NONCE = 'SET_NONCE' as const;
export const SET_PROPOSED_NONCE = 'SET_PROPOSED_NONCE' as const;
export const SET_MAX_VALUE_MODE = 'SET_MAX_VALUE_MODE' as const;
export const SET_TRANSACTION_VALUE = 'SET_TRANSACTION_VALUE' as const;

export type TransactionAssetType = typeof ETH | typeof ERC20 | typeof ERC721;

/**
 * Minimal shape of an asset used to derive the transaction asset type.
 * Any additional asset fields are preserved as-is in the action payload.
 */
export interface TransactionAsset {
  isETH?: boolean;
  tokenId?: string;
}

export interface ResetTransactionAction {
  type: typeof RESET_TRANSACTION;
}

export interface NewAssetTransactionAction<T extends TransactionAsset> {
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

export interface SetSelectedAssetAction<T extends TransactionAsset> {
  type: typeof SET_SELECTED_ASSET;
  selectedAsset: T;
  assetType: TransactionAssetType;
}

export interface PrepareTransactionAction<T extends object> {
  type: typeof PREPARE_TRANSACTION;
  transaction: T;
}

export interface SetTransactionSecurityAlertResponseAction<T> {
  type: typeof SET_TRANSACTION_SECURITY_ALERT_RESPONSE;
  transactionId: string | undefined;
  securityAlertResponse: T;
}

export interface SetTransactionObjectAction<T extends object> {
  type: typeof SET_TRANSACTION_OBJECT;
  transaction: T;
}

export interface SetTransactionIdAction {
  type: typeof SET_TRANSACTION_ID;
  transactionId: string;
}

export interface SetTokensTransactionAction<T extends object> {
  type: typeof SET_TOKENS_TRANSACTION;
  asset: T;
}

export interface SetEtherTransactionAction<T extends object> {
  type: typeof SET_ETHER_TRANSACTION;
  transaction: T;
}

export interface SetNonceAction {
  type: typeof SET_NONCE;
  nonce: string | number | undefined;
}

export interface SetProposedNonceAction {
  type: typeof SET_PROPOSED_NONCE;
  proposedNonce: string | number | undefined;
}

export interface SetMaxValueModeAction {
  type: typeof SET_MAX_VALUE_MODE;
  maxValueMode: boolean;
}

export interface SetTransactionValueAction {
  type: typeof SET_TRANSACTION_VALUE;
  value: string | undefined;
}

export type TransactionAction =
  | ResetTransactionAction
  | NewAssetTransactionAction<TransactionAsset>
  | SetRecipientAction
  | SetSelectedAssetAction<TransactionAsset>
  | PrepareTransactionAction<object>
  | SetTransactionSecurityAlertResponseAction<unknown>
  | SetTransactionObjectAction<object>
  | SetTransactionIdAction
  | SetTokensTransactionAction<object>
  | SetEtherTransactionAction<object>
  | SetNonceAction
  | SetProposedNonceAction
  | SetMaxValueModeAction
  | SetTransactionValueAction;

const getAssetType = (selectedAsset: TransactionAsset): TransactionAssetType =>
  selectedAsset.isETH ? ETH : selectedAsset.tokenId ? ERC721 : ERC20;

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
 * @param selectedAsset - Asset to start the transaction with
 */
export function newAssetTransaction<T extends TransactionAsset>(
  selectedAsset: T,
): NewAssetTransactionAction<T> {
  return {
    type: NEW_ASSET_TRANSACTION,
    selectedAsset,
    assetType: getAssetType(selectedAsset),
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
 * @param selectedAsset - Asset to start the transaction with
 */
export function setSelectedAsset<T extends TransactionAsset>(
  selectedAsset: T,
): SetSelectedAssetAction<T> {
  return {
    type: SET_SELECTED_ASSET,
    selectedAsset,
    assetType: getAssetType(selectedAsset),
  };
}

/**
 * Sets transaction object to be sent
 *
 * @param transaction - Transaction object with from, to, data, gas, gasPrice, value
 */
export function prepareTransaction<T extends object>(
  transaction: T,
): PrepareTransactionAction<T> {
  return {
    type: PREPARE_TRANSACTION,
    transaction,
  };
}

export function setTransactionSecurityAlertResponse<T>(
  transactionId: string | undefined,
  securityAlertResponse: T,
): SetTransactionSecurityAlertResponseAction<T> {
  return {
    type: SET_TRANSACTION_SECURITY_ALERT_RESPONSE,
    transactionId,
    securityAlertResponse,
  };
}

/**
 * Sets any attribute in transaction object
 *
 * @param transaction - New transaction object
 */
export function setTransactionObject<T extends object>(
  transaction: T,
): SetTransactionObjectAction<T> {
  return {
    type: SET_TRANSACTION_OBJECT,
    transaction,
  };
}

/**
 * Sets the current transaction ID only.
 *
 * @param transactionId - Id of the current transaction.
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
 * @param asset - Asset to start the transaction with
 */
export function setTokensTransaction<T extends object>(
  asset: T,
): SetTokensTransactionAction<T> {
  return {
    type: SET_TOKENS_TRANSACTION,
    asset,
  };
}

/**
 * Enable Ether only to send in a transaction
 *
 * @param transaction - Transaction additional object
 */
export function setEtherTransaction<T extends object>(
  transaction: T,
): SetEtherTransactionAction<T> {
  return {
    type: SET_ETHER_TRANSACTION,
    transaction,
  };
}

export function setNonce(nonce: string | number | undefined): SetNonceAction {
  return {
    type: SET_NONCE,
    nonce,
  };
}

export function setProposedNonce(
  proposedNonce: string | number | undefined,
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

export function setTransactionValue(
  value: string | undefined,
): SetTransactionValueAction {
  return {
    type: SET_TRANSACTION_VALUE,
    value,
  };
}
