import TransactionTypes from '../../core/TransactionTypes';

const {
  ASSET: { ETH, ERC20, ERC721 },
} = TransactionTypes;

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

export interface SelectedAsset {
  isETH?: boolean;
  tokenId?: string;
  symbol?: string;
  address?: string;
  decimals?: number;
  [key: string]: unknown;
}

export interface TransactionData {
  data?: string;
  from?: string;
  gas?: string;
  gasPrice?: string;
  to?: string;
  value?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  [key: string]: unknown;
}

export interface SecurityAlertResponse {
  [key: string]: unknown;
}

export interface ResetTransactionAction {
  type: TransactionActionType.RESET_TRANSACTION;
}

export interface NewAssetTransactionAction {
  type: TransactionActionType.NEW_ASSET_TRANSACTION;
  selectedAsset: SelectedAsset;
  assetType: string;
}

export interface SetRecipientAction {
  type: TransactionActionType.SET_RECIPIENT;
  from: string;
  to: string;
  ensRecipient: string;
  transactionToName: string;
  transactionFromName: string;
}

export interface SetSelectedAssetAction {
  type: TransactionActionType.SET_SELECTED_ASSET;
  selectedAsset: SelectedAsset;
  assetType: string;
}

export interface PrepareTransactionAction {
  type: TransactionActionType.PREPARE_TRANSACTION;
  transaction: TransactionData;
}

export interface SetTransactionSecurityAlertResponseAction {
  type: TransactionActionType.SET_TRANSACTION_SECURITY_ALERT_RESPONSE;
  transactionId: string;
  securityAlertResponse: SecurityAlertResponse;
}

export interface SetTransactionObjectAction {
  type: TransactionActionType.SET_TRANSACTION_OBJECT;
  transaction: TransactionData & { selectedAsset?: SelectedAsset; assetType?: string };
}

export interface SetTransactionIdAction {
  type: TransactionActionType.SET_TRANSACTION_ID;
  transactionId: string;
}

export interface SetTokensTransactionAction {
  type: TransactionActionType.SET_TOKENS_TRANSACTION;
  asset: SelectedAsset;
}

export interface SetEtherTransactionAction {
  type: TransactionActionType.SET_ETHER_TRANSACTION;
  transaction: TransactionData;
}

export interface SetNonceAction {
  type: TransactionActionType.SET_NONCE;
  nonce: string;
}

export interface SetProposedNonceAction {
  type: TransactionActionType.SET_PROPOSED_NONCE;
  proposedNonce: string;
}

export interface SetMaxValueModeAction {
  type: TransactionActionType.SET_MAX_VALUE_MODE;
  maxValueMode: boolean;
}

export interface SetTransactionValueAction {
  type: TransactionActionType.SET_TRANSACTION_VALUE;
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
    type: TransactionActionType.RESET_TRANSACTION,
  };
}

/**
 * Starts a new transaction state with an asset
 *
 * @param selectedAsset - Asset to start the transaction with
 */
export function newAssetTransaction(
  selectedAsset: SelectedAsset,
): NewAssetTransactionAction {
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
export function setSelectedAsset(
  selectedAsset: SelectedAsset,
): SetSelectedAssetAction {
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
export function prepareTransaction(
  transaction: TransactionData,
): PrepareTransactionAction {
  return {
    type: TransactionActionType.PREPARE_TRANSACTION,
    transaction,
  };
}

export function setTransactionSecurityAlertResponse(
  transactionId: string,
  securityAlertResponse: SecurityAlertResponse,
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
export function setTransactionObject(
  transaction: TransactionData & { selectedAsset?: SelectedAsset; assetType?: string },
): SetTransactionObjectAction {
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
export function setTokensTransaction(
  asset: SelectedAsset,
): SetTokensTransactionAction {
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
export function setEtherTransaction(
  transaction: TransactionData,
): SetEtherTransactionAction {
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
