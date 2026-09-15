import { REHYDRATE } from 'redux-persist';
import type { SecurityAlertResponse } from '@metamask/transaction-controller';
import type { TxMeta } from '../../util/transaction-reducer-helpers';

export type AssetType = 'ETH' | 'ERC20' | 'ERC721';

export interface SelectedAsset {
  isETH?: boolean;
  tokenId?: string;
  address?: string;
  symbol?: string;
  decimals?: number;
  name?: string;
  image?: string;
  standard?: string;
  [key: string]: unknown;
}

export type TransactionPayload = Partial<TxMeta> & {
  selectedAsset?: SelectedAsset;
  assetType?: AssetType;
  [key: string]: unknown;
};

const ETH: AssetType = 'ETH';
const ERC20: AssetType = 'ERC20';
const ERC721: AssetType = 'ERC721';

export interface ResetTransactionAction {
  type: 'RESET_TRANSACTION';
}
export interface NewAssetTransactionAction {
  type: 'NEW_ASSET_TRANSACTION';
  selectedAsset: SelectedAsset;
  assetType: AssetType;
}
export interface SetRecipientAction {
  type: 'SET_RECIPIENT';
  from: string;
  to: string;
  ensRecipient: string;
  transactionToName: string;
  transactionFromName: string;
}
export interface SetSelectedAssetAction {
  type: 'SET_SELECTED_ASSET';
  selectedAsset: SelectedAsset;
  assetType: AssetType;
}
export interface PrepareTransactionAction {
  type: 'PREPARE_TRANSACTION';
  transaction: TransactionPayload;
}
export interface SetTransactionSecurityAlertResponseAction {
  type: 'SET_TRANSACTION_SECURITY_ALERT_RESPONSE';
  transactionId: string;
  securityAlertResponse: SecurityAlertResponse;
}
export interface SetTransactionObjectAction {
  type: 'SET_TRANSACTION_OBJECT';
  transaction: TransactionPayload;
}
export interface SetTransactionIdAction {
  type: 'SET_TRANSACTION_ID';
  transactionId: string;
}
export interface SetTokensTransactionAction {
  type: 'SET_TOKENS_TRANSACTION';
  asset: SelectedAsset;
}
export interface SetEtherTransactionAction {
  type: 'SET_ETHER_TRANSACTION';
  transaction: TransactionPayload;
}
export interface SetNonceAction {
  type: 'SET_NONCE';
  nonce: number;
}
export interface SetProposedNonceAction {
  type: 'SET_PROPOSED_NONCE';
  proposedNonce: number;
}
export interface SetMaxValueModeAction {
  type: 'SET_MAX_VALUE_MODE';
  maxValueMode: boolean;
}
export interface SetTransactionValueAction {
  type: 'SET_TRANSACTION_VALUE';
  value: TxMeta['value'];
}
export interface RehydrateTransactionAction {
  type: typeof REHYDRATE;
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
  | SetTransactionValueAction
  | RehydrateTransactionAction;

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
 * @param {object} selectedAsset - Asset to start the transaction with
 */
export function newAssetTransaction(
  selectedAsset: SelectedAsset | object,
): NewAssetTransactionAction {
  const typedSelectedAsset = selectedAsset as SelectedAsset;
  return {
    type: 'NEW_ASSET_TRANSACTION',
    selectedAsset: typedSelectedAsset,
    assetType: typedSelectedAsset.isETH
      ? ETH
      : typedSelectedAsset.tokenId
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
  ensRecipient: string,
  transactionToName: string,
  transactionFromName: string,
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
 * @param {object} selectedAsset - Asset to start the transaction with
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
 * @param {object} transaction - Transaction object with from, to, data, gas, gasPrice, value
 */
export function prepareTransaction(
  transaction: TransactionPayload,
): PrepareTransactionAction {
  return {
    type: 'PREPARE_TRANSACTION',
    transaction,
  };
}

export function setTransactionSecurityAlertResponse(
  transactionId: string,
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
 * @param {object} transaction - New transaction object
 */
export function setTransactionObject(
  transaction: TransactionPayload,
): SetTransactionObjectAction {
  return {
    type: 'SET_TRANSACTION_OBJECT',
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
    type: 'SET_TRANSACTION_ID',
    transactionId,
  };
}

/**
 * Enable selectable tokens (ERC20 and Ether) to send in a transaction
 *
 * @param {object} asset - Asset to start the transaction with
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
 * @param {object} transaction - Transaction additional object
 */
export function setEtherTransaction(
  transaction: TransactionPayload,
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

export function setProposedNonce(
  proposedNonce: number,
): SetProposedNonceAction {
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

export function setTransactionValue(
  value: TxMeta['value'],
): SetTransactionValueAction {
  return {
    type: 'SET_TRANSACTION_VALUE',
    value,
  };
}
