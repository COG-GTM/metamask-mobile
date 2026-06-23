import { SecurityAlertResponse } from '../../components/Views/confirmations/legacy/components/BlockaidBanner/BlockaidBanner.types';
import TransactionTypes from '../../core/TransactionTypes';

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

type AssetType = typeof ETH | typeof ERC20 | typeof ERC721;

interface SelectedAsset {
  isETH?: boolean;
  tokenId?: string | number;
}

type TransactionPayload = Record<string, unknown>;

interface ResetTransactionAction {
  type: typeof RESET_TRANSACTION;
}

interface NewAssetTransactionAction {
  type: typeof NEW_ASSET_TRANSACTION;
  selectedAsset: SelectedAsset;
  assetType: AssetType;
}

interface SetRecipientAction {
  type: typeof SET_RECIPIENT;
  from: string;
  to?: string;
  ensRecipient?: string;
  transactionToName?: string;
  transactionFromName?: string;
}

interface SetSelectedAssetAction {
  type: typeof SET_SELECTED_ASSET;
  selectedAsset: SelectedAsset;
  assetType: AssetType;
}

interface PrepareTransactionAction {
  type: typeof PREPARE_TRANSACTION;
  transaction: TransactionPayload;
}

interface SetTransactionSecurityAlertResponseAction {
  type: typeof SET_TRANSACTION_SECURITY_ALERT_RESPONSE;
  transactionId: string | undefined;
  securityAlertResponse: SecurityAlertResponse;
}

interface SetTransactionObjectAction {
  type: typeof SET_TRANSACTION_OBJECT;
  transaction: TransactionPayload;
}

interface SetTransactionIdAction {
  type: typeof SET_TRANSACTION_ID;
  transactionId: string;
}

interface SetTokensTransactionAction {
  type: typeof SET_TOKENS_TRANSACTION;
  asset: SelectedAsset;
}

interface SetEtherTransactionAction {
  type: typeof SET_ETHER_TRANSACTION;
  transaction: TransactionPayload;
}

interface SetNonceAction {
  type: typeof SET_NONCE;
  nonce: number;
}

interface SetProposedNonceAction {
  type: typeof SET_PROPOSED_NONCE;
  proposedNonce: number;
}

interface SetMaxValueModeAction {
  type: typeof SET_MAX_VALUE_MODE;
  maxValueMode: boolean;
}

interface SetTransactionValueAction {
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
 * @param selectedAsset - Asset to start the transaction with
 */
export function newAssetTransaction<T extends SelectedAsset>(
  selectedAsset: T,
): NewAssetTransactionAction {
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
 * @param from - Address to send the transaction from
 * @param to - Address to send the transaction to
 * @param ensRecipient - Resolved ens name to send the transaction to
 * @param transactionToName - Resolved address book name for to address
 * @param transactionFromName - Resolved address book name for from address
 */
export function setRecipient(
  from: string,
  to?: string,
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
export function setSelectedAsset<T extends SelectedAsset>(
  selectedAsset: T,
): SetSelectedAssetAction {
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
 * @param transaction - Transaction object with from, to, data, gas, gasPrice, value
 */
export function prepareTransaction(
  transaction: TransactionPayload,
): PrepareTransactionAction {
  return {
    type: PREPARE_TRANSACTION,
    transaction,
  };
}

export function setTransactionSecurityAlertResponse(
  transactionId: string | undefined,
  securityAlertResponse: SecurityAlertResponse,
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
 * @param transaction - New transaction object
 */
export function setTransactionObject(
  transaction: TransactionPayload,
): SetTransactionObjectAction {
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
export function setTokensTransaction(
  asset: SelectedAsset,
): SetTokensTransactionAction {
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
export function setEtherTransaction(
  transaction: TransactionPayload,
): SetEtherTransactionAction {
  return {
    type: SET_ETHER_TRANSACTION,
    transaction,
  };
}

export function setNonce(nonce: number): SetNonceAction {
  return {
    type: SET_NONCE,
    nonce,
  };
}

export function setProposedNonce(
  proposedNonce: number,
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
