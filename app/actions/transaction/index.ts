import TransactionTypes from '../../core/TransactionTypes';

const {
  ASSET: { ETH, ERC20, ERC721 },
} = TransactionTypes;

// Action type constants
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

// Type definitions
interface SelectedAsset {
  isETH?: boolean;
  tokenId?: string;
  address?: string;
  symbol?: string;
  decimals?: number;
  image?: string;
  name?: string;
  standard?: string;
}

interface TransactionObject {
  from?: string;
  to?: string;
  data?: string;
  gas?: string;
  gasPrice?: string;
  value?: string;
  nonce?: string;
}

interface SecurityAlertResponse {
  result_type?: string;
  reason?: string;
  features?: string[];
  block?: number;
  req_id?: string;
}

/**
 * Clears transaction object completely
 */
export function resetTransaction() {
  return {
    type: RESET_TRANSACTION,
  };
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
  ensRecipient: string | undefined,
  transactionToName: string | undefined,
  transactionFromName: string | undefined,
) {
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
export function setSelectedAsset(selectedAsset: SelectedAsset) {
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
export function prepareTransaction(transaction: TransactionObject) {
  return {
    type: PREPARE_TRANSACTION,
    transaction,
  };
}

export function setTransactionSecurityAlertResponse(
  transactionId: string,
  securityAlertResponse: SecurityAlertResponse,
) {
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
export function setTransactionObject(transaction: TransactionObject) {
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
export function setTransactionId(transactionId: string) {
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
export function setTokensTransaction(asset: SelectedAsset) {
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
export function setEtherTransaction(transaction: TransactionObject) {
  return {
    type: SET_ETHER_TRANSACTION,
    transaction,
  };
}

export function setNonce(nonce: string) {
  return {
    type: SET_NONCE,
    nonce,
  };
}

export function setProposedNonce(proposedNonce: string) {
  return {
    type: SET_PROPOSED_NONCE,
    proposedNonce,
  };
}

export function setMaxValueMode(maxValueMode: boolean) {
  return {
    type: SET_MAX_VALUE_MODE,
    maxValueMode,
  };
}

export function setTransactionValue(value: string) {
  return {
    type: SET_TRANSACTION_VALUE,
    value,
  };
}
