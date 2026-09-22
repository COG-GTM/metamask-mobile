import TransactionTypes from '../../core/TransactionTypes';

const {
  ASSET: { ETH, ERC20, ERC721 },
} = TransactionTypes;

export type AssetType = typeof ETH | typeof ERC20 | typeof ERC721;

/**
 * Asset a transaction is started with. Assets come from several controllers
 * and from screen level compositions, so only the fields used to derive the
 * asset type are read.
 */
export type SelectedAsset = object;

interface AssetTypeFields {
  isETH?: boolean;
  tokenId?: string | number;
}

/**
 * Transaction object held in redux state. Values are produced by callers in
 * several formats (hex strings, BN instances), so they are not narrowed here.
 */
export type TransactionObject = object;

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
  from?: string;
  to?: string;
  ensRecipient?: string;
  transactionToName?: string;
  transactionFromName?: string;
}

export interface SetSelectedAssetAction {
  type: 'SET_SELECTED_ASSET';
  selectedAsset: SelectedAsset;
  assetType: AssetType;
}

export interface PrepareTransactionAction {
  type: 'PREPARE_TRANSACTION';
  transaction: TransactionObject;
}

export interface SetTransactionSecurityAlertResponseAction {
  type: 'SET_TRANSACTION_SECURITY_ALERT_RESPONSE';
  transactionId: string | undefined;
  securityAlertResponse: unknown;
}

export interface SetTransactionObjectAction {
  type: 'SET_TRANSACTION_OBJECT';
  transaction: TransactionObject;
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
  transaction: TransactionObject;
}

export interface SetNonceAction {
  type: 'SET_NONCE';
  nonce: number | undefined;
}

export interface SetProposedNonceAction {
  type: 'SET_PROPOSED_NONCE';
  proposedNonce: number | undefined;
}

export interface SetMaxValueModeAction {
  type: 'SET_MAX_VALUE_MODE';
  maxValueMode: boolean;
}

export interface SetTransactionValueAction {
  type: 'SET_TRANSACTION_VALUE';
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

const getAssetType = (selectedAsset: SelectedAsset): AssetType => {
  const { isETH, tokenId } = selectedAsset as AssetTypeFields;
  if (isETH) {
    return ETH;
  }
  return tokenId ? ERC721 : ERC20;
};

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
  selectedAsset: SelectedAsset,
): NewAssetTransactionAction {
  return {
    type: 'NEW_ASSET_TRANSACTION',
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
  from?: string,
  to?: string,
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
    assetType: getAssetType(selectedAsset),
  };
}

/**
 * Sets transaction object to be sent
 *
 * @param transaction - Transaction object with from, to, data, gas, gasPrice, value
 */
export function prepareTransaction(
  transaction: TransactionObject,
): PrepareTransactionAction {
  return {
    type: 'PREPARE_TRANSACTION',
    transaction,
  };
}

export function setTransactionSecurityAlertResponse(
  transactionId: string | undefined,
  securityAlertResponse: unknown,
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
  transaction: TransactionObject,
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
  transaction: TransactionObject,
): SetEtherTransactionAction {
  return {
    type: 'SET_ETHER_TRANSACTION',
    transaction,
  };
}

export function setNonce(nonce: number | undefined): SetNonceAction {
  return {
    type: 'SET_NONCE',
    nonce,
  };
}

export function setProposedNonce(
  proposedNonce: number | undefined,
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

export function setTransactionValue(value: string): SetTransactionValueAction {
  return {
    type: 'SET_TRANSACTION_VALUE',
    value,
  };
}
