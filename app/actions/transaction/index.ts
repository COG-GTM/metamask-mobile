import type { Action as ReduxAction } from 'redux';
import TransactionTypes from '../../core/TransactionTypes';

const {
  ASSET: { ETH, ERC20, ERC721 },
} = TransactionTypes;

export enum ActionType {
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

export interface SelectedAsset {
  isETH?: boolean;
  isNative?: boolean;
  tokenId?: string | number | null;
  symbol?: string | null;
  address?: string | null;
  decimals?: number | null;
  contractName?: string | null;
  name?: string | null;
  image?: string | null;
  standard?: string | null;
  chainId?: string | number | null;
  description?: string | null;
}

export interface TransactionObject {
  data?: string;
  from?: string;
  gas?: string;
  gasPrice?: string;
  to?: string;
  value?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  selectedAsset?: SelectedAsset;
}

export interface SecurityAlertResponse {
  result_type?: string;
  reason?: string;
  features?: unknown[];
}

export interface ResetTransactionAction
  extends ReduxAction<ActionType.RESET_TRANSACTION> {}

export interface NewAssetTransactionAction
  extends ReduxAction<ActionType.NEW_ASSET_TRANSACTION> {
  selectedAsset: SelectedAsset;
  assetType: string;
}

export interface SetRecipientAction
  extends ReduxAction<ActionType.SET_RECIPIENT> {
  from: string;
  to: string;
  ensRecipient?: string;
  transactionToName?: string;
  transactionFromName?: string;
}

export interface SetSelectedAssetAction
  extends ReduxAction<ActionType.SET_SELECTED_ASSET> {
  selectedAsset: SelectedAsset;
  assetType: string;
}

export interface PrepareTransactionAction
  extends ReduxAction<ActionType.PREPARE_TRANSACTION> {
  transaction: TransactionObject;
}

export interface SetTransactionSecurityAlertResponseAction
  extends ReduxAction<ActionType.SET_TRANSACTION_SECURITY_ALERT_RESPONSE> {
  transactionId: string | undefined;
  securityAlertResponse: SecurityAlertResponse;
}

export interface SetTransactionObjectAction
  extends ReduxAction<ActionType.SET_TRANSACTION_OBJECT> {
  transaction: TransactionObject;
}

export interface SetTransactionIdAction
  extends ReduxAction<ActionType.SET_TRANSACTION_ID> {
  transactionId: string;
}

export interface SetTokensTransactionAction
  extends ReduxAction<ActionType.SET_TOKENS_TRANSACTION> {
  asset: SelectedAsset;
}

export interface SetEtherTransactionAction
  extends ReduxAction<ActionType.SET_ETHER_TRANSACTION> {
  transaction: TransactionObject;
}

export interface SetNonceAction extends ReduxAction<ActionType.SET_NONCE> {
  nonce: number;
}

export interface SetProposedNonceAction
  extends ReduxAction<ActionType.SET_PROPOSED_NONCE> {
  proposedNonce: number;
}

export interface SetMaxValueModeAction
  extends ReduxAction<ActionType.SET_MAX_VALUE_MODE> {
  maxValueMode: boolean;
}

export interface SetTransactionValueAction
  extends ReduxAction<ActionType.SET_TRANSACTION_VALUE> {
  value: string;
}

export type Action =
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

const resolveAssetType = (selectedAsset: SelectedAsset): string =>
  selectedAsset.isETH ? ETH : selectedAsset.tokenId ? ERC721 : ERC20;

/**
 * Clears transaction object completely
 */
export function resetTransaction(): ResetTransactionAction {
  return {
    type: ActionType.RESET_TRANSACTION,
  };
}

/**
 * Starts a new transaction state with an asset
 */
export function newAssetTransaction(
  selectedAsset: SelectedAsset,
): NewAssetTransactionAction {
  return {
    type: ActionType.NEW_ASSET_TRANSACTION,
    selectedAsset,
    assetType: resolveAssetType(selectedAsset),
  };
}

/**
 * Sets transaction to address and ensRecipient in case is available
 */
export function setRecipient(
  from: string,
  to: string,
  ensRecipient?: string,
  transactionToName?: string,
  transactionFromName?: string,
): SetRecipientAction {
  return {
    type: ActionType.SET_RECIPIENT,
    from,
    to,
    ensRecipient,
    transactionToName,
    transactionFromName,
  };
}

/**
 * Sets asset as selectedAsset
 */
export function setSelectedAsset(
  selectedAsset: SelectedAsset,
): SetSelectedAssetAction {
  return {
    type: ActionType.SET_SELECTED_ASSET,
    selectedAsset,
    assetType: resolveAssetType(selectedAsset),
  };
}

/**
 * Sets transaction object to be sent
 */
export function prepareTransaction(
  transaction: TransactionObject,
): PrepareTransactionAction {
  return {
    type: ActionType.PREPARE_TRANSACTION,
    transaction,
  };
}

export function setTransactionSecurityAlertResponse(
  transactionId: string | undefined,
  securityAlertResponse: SecurityAlertResponse,
): SetTransactionSecurityAlertResponseAction {
  return {
    type: ActionType.SET_TRANSACTION_SECURITY_ALERT_RESPONSE,
    transactionId,
    securityAlertResponse,
  };
}

/**
 * Sets any attribute in transaction object
 */
export function setTransactionObject(
  transaction: TransactionObject,
): SetTransactionObjectAction {
  return {
    type: ActionType.SET_TRANSACTION_OBJECT,
    transaction,
  };
}

/**
 * Sets the current transaction ID only.
 */
export function setTransactionId(
  transactionId: string,
): SetTransactionIdAction {
  return {
    type: ActionType.SET_TRANSACTION_ID,
    transactionId,
  };
}

/**
 * Enable selectable tokens (ERC20 and Ether) to send in a transaction
 */
export function setTokensTransaction(
  asset: SelectedAsset,
): SetTokensTransactionAction {
  return {
    type: ActionType.SET_TOKENS_TRANSACTION,
    asset,
  };
}

/**
 * Enable Ether only to send in a transaction
 */
export function setEtherTransaction(
  transaction: TransactionObject,
): SetEtherTransactionAction {
  return {
    type: ActionType.SET_ETHER_TRANSACTION,
    transaction,
  };
}

export function setNonce(nonce: number): SetNonceAction {
  return {
    type: ActionType.SET_NONCE,
    nonce,
  };
}

export function setProposedNonce(
  proposedNonce: number,
): SetProposedNonceAction {
  return {
    type: ActionType.SET_PROPOSED_NONCE,
    proposedNonce,
  };
}

export function setMaxValueMode(
  maxValueMode: boolean,
): SetMaxValueModeAction {
  return {
    type: ActionType.SET_MAX_VALUE_MODE,
    maxValueMode,
  };
}

export function setTransactionValue(
  value: string,
): SetTransactionValueAction {
  return {
    type: ActionType.SET_TRANSACTION_VALUE,
    value,
  };
}
