import TransactionTypes from '../../core/TransactionTypes';

const {
  ASSET: { ETH, ERC20, ERC721 },
} = TransactionTypes;

export const RESET_TRANSACTION = 'RESET_TRANSACTION' as const;
export const NEW_ASSET_TRANSACTION = 'NEW_ASSET_TRANSACTION' as const;
export const SET_RECIPIENT = 'SET_RECIPIENT' as const;
export const SET_SELECTED_ASSET = 'SET_SELECTED_ASSET' as const;
export const PREPARE_TRANSACTION = 'PREPARE_TRANSACTION' as const;
export const SET_TRANSACTION_SECURITY_ALERT_RESPONSE = 'SET_TRANSACTION_SECURITY_ALERT_RESPONSE' as const;
export const SET_TRANSACTION_OBJECT = 'SET_TRANSACTION_OBJECT' as const;
export const SET_TRANSACTION_ID = 'SET_TRANSACTION_ID' as const;
export const SET_TOKENS_TRANSACTION = 'SET_TOKENS_TRANSACTION' as const;
export const SET_ETHER_TRANSACTION = 'SET_ETHER_TRANSACTION' as const;
export const SET_NONCE = 'SET_NONCE' as const;
export const SET_PROPOSED_NONCE = 'SET_PROPOSED_NONCE' as const;
export const SET_MAX_VALUE_MODE = 'SET_MAX_VALUE_MODE' as const;
export const SET_TRANSACTION_VALUE = 'SET_TRANSACTION_VALUE' as const;

interface SelectedAsset {
  isETH?: boolean;
  tokenId?: string;
  [key: string]: unknown;
}

interface TransactionObject {
  from?: string;
  to?: string;
  data?: string;
  gas?: string;
  gasPrice?: string;
  value?: string;
  [key: string]: unknown;
}

export type TransactionAction =
  | { type: typeof RESET_TRANSACTION }
  | { type: typeof NEW_ASSET_TRANSACTION; selectedAsset: SelectedAsset; assetType: string }
  | { type: typeof SET_RECIPIENT; from: string; to: string; ensRecipient: string; transactionToName: string; transactionFromName: string }
  | { type: typeof SET_SELECTED_ASSET; selectedAsset: SelectedAsset; assetType: string }
  | { type: typeof PREPARE_TRANSACTION; transaction: TransactionObject }
  | { type: typeof SET_TRANSACTION_SECURITY_ALERT_RESPONSE; transactionId: string; securityAlertResponse: unknown }
  | { type: typeof SET_TRANSACTION_OBJECT; transaction: TransactionObject }
  | { type: typeof SET_TRANSACTION_ID; transactionId: string }
  | { type: typeof SET_TOKENS_TRANSACTION; asset: SelectedAsset }
  | { type: typeof SET_ETHER_TRANSACTION; transaction: TransactionObject }
  | { type: typeof SET_NONCE; nonce: string }
  | { type: typeof SET_PROPOSED_NONCE; proposedNonce: string }
  | { type: typeof SET_MAX_VALUE_MODE; maxValueMode: boolean }
  | { type: typeof SET_TRANSACTION_VALUE; value: string };

/**
 * Clears transaction object completely
 */
export function resetTransaction() {
  return {
    type: RESET_TRANSACTION,
  } as const;
}

/**
 * Starts a new transaction state with an asset
 *
 * @param selectedAsset - Asset to start the transaction with
 */
export function newAssetTransaction(selectedAsset: SelectedAsset) {
  return {
    type: NEW_ASSET_TRANSACTION,
    selectedAsset,
    assetType: selectedAsset.isETH
      ? ETH
      : selectedAsset.tokenId
      ? ERC721
      : ERC20,
  } as const;
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
) {
  return {
    type: SET_RECIPIENT,
    from,
    to,
    ensRecipient,
    transactionToName,
    transactionFromName,
  } as const;
}

/**
 * Sets asset as selectedAsset
 *
 * @param selectedAsset - Asset to start the transaction with
 */
export function setSelectedAsset(selectedAsset: SelectedAsset) {
  return {
    type: SET_SELECTED_ASSET,
    selectedAsset,
    assetType: selectedAsset.isETH
      ? ETH
      : selectedAsset.tokenId
      ? ERC721
      : ERC20,
  } as const;
}

/**
 * Sets transaction object to be sent
 *
 * @param transaction - Transaction object with from, to, data, gas, gasPrice, value
 */
export function prepareTransaction(transaction: TransactionObject) {
  return {
    type: PREPARE_TRANSACTION,
    transaction,
  } as const;
}

export function setTransactionSecurityAlertResponse(
  transactionId: string,
  securityAlertResponse: unknown,
) {
  return {
    type: SET_TRANSACTION_SECURITY_ALERT_RESPONSE,
    transactionId,
    securityAlertResponse,
  } as const;
}

/**
 * Sets any attribute in transaction object
 *
 * @param transaction - New transaction object
 */
export function setTransactionObject(transaction: TransactionObject) {
  return {
    type: SET_TRANSACTION_OBJECT,
    transaction,
  } as const;
}

/**
 * Sets the current transaction ID only.
 *
 * @param transactionId - Id of the current transaction.
 */
export function setTransactionId(transactionId: string) {
  return {
    type: SET_TRANSACTION_ID,
    transactionId,
  } as const;
}

/**
 * Enable selectable tokens (ERC20 and Ether) to send in a transaction
 *
 * @param asset - Asset to start the transaction with
 */
export function setTokensTransaction(asset: SelectedAsset) {
  return {
    type: SET_TOKENS_TRANSACTION,
    asset,
  } as const;
}

/**
 * Enable Ether only to send in a transaction
 *
 * @param transaction - Transaction additional object
 */
export function setEtherTransaction(transaction: TransactionObject) {
  return {
    type: SET_ETHER_TRANSACTION,
    transaction,
  } as const;
}

export function setNonce(nonce: string) {
  return {
    type: SET_NONCE,
    nonce,
  } as const;
}

export function setProposedNonce(proposedNonce: string) {
  return {
    type: SET_PROPOSED_NONCE,
    proposedNonce,
  } as const;
}

export function setMaxValueMode(maxValueMode: boolean) {
  return {
    type: SET_MAX_VALUE_MODE,
    maxValueMode,
  } as const;
}

export function setTransactionValue(value: string) {
  return {
    type: SET_TRANSACTION_VALUE,
    value,
  } as const;
}
