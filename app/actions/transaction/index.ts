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

interface TransactionAsset {
  isETH?: boolean;
  tokenId?: unknown;
}

interface TransactionAction {
  type:
    | typeof RESET_TRANSACTION
    | typeof NEW_ASSET_TRANSACTION
    | typeof SET_RECIPIENT
    | typeof SET_SELECTED_ASSET
    | typeof PREPARE_TRANSACTION
    | typeof SET_TRANSACTION_SECURITY_ALERT_RESPONSE
    | typeof SET_TRANSACTION_OBJECT
    | typeof SET_TRANSACTION_ID
    | typeof SET_TOKENS_TRANSACTION
    | typeof SET_ETHER_TRANSACTION
    | typeof SET_NONCE
    | typeof SET_PROPOSED_NONCE
    | typeof SET_MAX_VALUE_MODE
    | typeof SET_TRANSACTION_VALUE;
  selectedAsset?: unknown;
  assetType?: unknown;
  from?: unknown;
  to?: unknown;
  ensRecipient?: unknown;
  transactionToName?: unknown;
  transactionFromName?: unknown;
  transaction?: unknown;
  transactionId?: unknown;
  securityAlertResponse?: unknown;
  asset?: unknown;
  nonce?: unknown;
  proposedNonce?: unknown;
  maxValueMode?: unknown;
  value?: unknown;
}

export type Action = TransactionAction;

/**
 * Clears transaction object completely
 */
export function resetTransaction(): TransactionAction {
  return {
    type: RESET_TRANSACTION,
  };
}

/**
 * Starts a new transaction state with an asset
 *
 * @param {object} selectedAsset - Asset to start the transaction with
 */
export function newAssetTransaction(selectedAsset: TransactionAsset): TransactionAction {
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
  from: unknown,
  to: unknown,
  ensRecipient: unknown,
  transactionToName: unknown,
  transactionFromName: unknown,
): TransactionAction {
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
export function setSelectedAsset(
  selectedAsset: TransactionAsset,
): TransactionAction {
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
export function prepareTransaction(transaction: unknown): TransactionAction {
  return {
    type: PREPARE_TRANSACTION,
    transaction,
  };
}

export function setTransactionSecurityAlertResponse(
  transactionId: unknown,
  securityAlertResponse: unknown,
): TransactionAction {
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
export function setTransactionObject(transaction: unknown): TransactionAction {
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
export function setTransactionId(transactionId: unknown): TransactionAction {
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
export function setTokensTransaction(asset: unknown): TransactionAction {
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
export function setEtherTransaction(transaction: unknown): TransactionAction {
  return {
    type: SET_ETHER_TRANSACTION,
    transaction,
  };
}

export function setNonce(nonce: unknown): TransactionAction {
  return {
    type: SET_NONCE,
    nonce,
  };
}

export function setProposedNonce(proposedNonce: unknown): TransactionAction {
  return {
    type: SET_PROPOSED_NONCE,
    proposedNonce,
  };
}

export function setMaxValueMode(maxValueMode: unknown): TransactionAction {
  return {
    type: SET_MAX_VALUE_MODE,
    maxValueMode,
  };
}

export function setTransactionValue(value: unknown): TransactionAction {
  return {
    type: SET_TRANSACTION_VALUE,
    value,
  };
}
