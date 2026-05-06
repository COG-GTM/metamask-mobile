import type { Action } from 'redux';
import TransactionTypes from '../../core/TransactionTypes';

const ETH = TransactionTypes.ASSET.ETH as AssetType;
const ERC20 = TransactionTypes.ASSET.ERC20 as AssetType;
const ERC721 = TransactionTypes.ASSET.ERC721 as AssetType;

export interface SelectedAsset {
  isETH?: boolean;
  isNative?: boolean;
  tokenId?: string;
  symbol?: string;
  address?: string;
  decimals?: number | string;
  image?: string;
}

export interface TransactionParams {
  from?: string;
  to?: string;
  data?: string;
  gas?: string;
  gasPrice?: string;
  value?: string;
  nonce?: string | number;
  chainId?: string;
  type?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
}

export type AssetType = 'ETH' | 'ERC20' | 'ERC721' | 'ERC1155';



export interface SecurityAlertResponse {
  result_type?: string;
  reason?: string;
  features?: (string | Record<string, string>)[];
  providerRequestsCount?: Record<string, number>;
  source?: string;
  description?: string;
}

export type ResetTransactionAction = Action<'RESET_TRANSACTION'>;

export interface NewAssetTransactionAction
  extends Action<'NEW_ASSET_TRANSACTION'> {
  selectedAsset: SelectedAsset | object;
  assetType: AssetType;
}

export interface SetRecipientAction extends Action<'SET_RECIPIENT'> {
  from: string;
  to: string;
  ensRecipient?: string;
  transactionToName?: string;
  transactionFromName?: string;
}

export interface SetSelectedAssetAction extends Action<'SET_SELECTED_ASSET'> {
  selectedAsset: SelectedAsset;
  assetType: AssetType;
}

export interface PrepareTransactionAction extends Action<'PREPARE_TRANSACTION'> {
  transaction: TransactionParams;
}

export interface SetTransactionSecurityAlertResponseAction
  extends Action<'SET_TRANSACTION_SECURITY_ALERT_RESPONSE'> {
  transactionId: string | undefined;
  securityAlertResponse: SecurityAlertResponse;
}

export interface SetTransactionObjectAction
  extends Action<'SET_TRANSACTION_OBJECT'> {
  transaction: TransactionParams;
}

export interface SetTransactionIdAction extends Action<'SET_TRANSACTION_ID'> {
  transactionId: string;
}

export interface SetTokensTransactionAction
  extends Action<'SET_TOKENS_TRANSACTION'> {
  asset: SelectedAsset;
}

export interface SetEtherTransactionAction
  extends Action<'SET_ETHER_TRANSACTION'> {
  transaction: TransactionParams;
}

export interface SetNonceAction extends Action<'SET_NONCE'> {
  nonce: number;
}

export interface SetProposedNonceAction extends Action<'SET_PROPOSED_NONCE'> {
  proposedNonce: number;
}

export interface SetMaxValueModeAction extends Action<'SET_MAX_VALUE_MODE'> {
  maxValueMode: boolean;
}

export interface SetTransactionValueAction
  extends Action<'SET_TRANSACTION_VALUE'> {
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
    type: 'RESET_TRANSACTION',
  };
}

/**
 * Starts a new transaction state with an asset
 *
 * @param selectedAsset - Asset to start the transaction with
 */
export function newAssetTransaction(
  selectedAsset: SelectedAsset | object,
): NewAssetTransactionAction {
  const asset = selectedAsset as SelectedAsset;
  return {
    type: 'NEW_ASSET_TRANSACTION',
    selectedAsset,
    assetType: asset.isETH ? ETH : asset.tokenId ? ERC721 : ERC20,
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
    type: 'SET_RECIPIENT',
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
export function setSelectedAsset(
  selectedAsset: SelectedAsset,
): SetSelectedAssetAction {
  return {
    type: 'SET_SELECTED_ASSET',
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
export function prepareTransaction(
  transaction: TransactionParams,
): PrepareTransactionAction {
  return {
    type: 'PREPARE_TRANSACTION',
    transaction,
  };
}

export function setTransactionSecurityAlertResponse(
  transactionId: string | undefined,
  securityAlertResponse: SecurityAlertResponse,
): SetTransactionSecurityAlertResponseAction {
  return {
    type: 'SET_TRANSACTION_SECURITY_ALERT_RESPONSE',
    transactionId,
    securityAlertResponse,
  };
}

/**
 * Sets any attribute in transaction object
 *
 * @param transaction - New transaction object
 */
export function setTransactionObject(
  transaction: TransactionParams,
): SetTransactionObjectAction {
  return {
    type: 'SET_TRANSACTION_OBJECT',
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
    type: 'SET_TRANSACTION_ID',
    transactionId,
  };
}

/**
 * Enable selectable tokens (ERC20 and Ether) to send in a transaction
 *
 * @param asset - Asset to start the transaction with
 */
export function setTokensTransaction(
  asset: SelectedAsset,
): SetTokensTransactionAction {
  return {
    type: 'SET_TOKENS_TRANSACTION',
    asset,
  };
}

/**
 * Enable Ether only to send in a transaction
 *
 * @param transaction - Transaction additional object
 */
export function setEtherTransaction(
  transaction: TransactionParams,
): SetEtherTransactionAction {
  return {
    type: 'SET_ETHER_TRANSACTION',
    transaction,
  };
}

export function setNonce(nonce: number): SetNonceAction {
  return {
    type: 'SET_NONCE',
    nonce,
  };
}

export function setProposedNonce(proposedNonce: number): SetProposedNonceAction {
  return {
    type: 'SET_PROPOSED_NONCE',
    proposedNonce,
  };
}

export function setMaxValueMode(maxValueMode: boolean): SetMaxValueModeAction {
  return {
    type: 'SET_MAX_VALUE_MODE',
    maxValueMode,
  };
}

export function setTransactionValue(value: string): SetTransactionValueAction {
  return {
    type: 'SET_TRANSACTION_VALUE',
    value,
  };
}
