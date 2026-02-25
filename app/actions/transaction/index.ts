import TransactionTypes from '../../core/TransactionTypes';
import { SelectedAsset, SecurityAlertResponse } from '../../reducers/transaction';

const {
  ASSET: { ETH, ERC20, ERC721 },
} = TransactionTypes;

/**
 * Clears transaction object completely
 */
export function resetTransaction() {
  return {
    type: 'RESET_TRANSACTION' as const,
  };
}

/**
 * Starts a new transaction state with an asset
 *
 * @param {object} selectedAsset - Asset to start the transaction with
 */
export function newAssetTransaction(selectedAsset: SelectedAsset) {
  return {
    type: 'NEW_ASSET_TRANSACTION' as const,
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
  from: string,
  to: string,
  ensRecipient: string,
  transactionToName: string,
  transactionFromName: string,
) {
  return {
    type: 'SET_RECIPIENT' as const,
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
export function setSelectedAsset(selectedAsset: SelectedAsset) {
  return {
    type: 'SET_SELECTED_ASSET' as const,
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
export function prepareTransaction(transaction: Record<string, unknown>) {
  return {
    type: 'PREPARE_TRANSACTION' as const,
    transaction,
  };
}

export function setTransactionSecurityAlertResponse(
  transactionId: string,
  securityAlertResponse: SecurityAlertResponse,
) {
  return {
    type: 'SET_TRANSACTION_SECURITY_ALERT_RESPONSE' as const,
    transactionId,
    securityAlertResponse,
  };
}

/**
 * Sets any attribute in transaction object
 *
 * @param {object} transaction - New transaction object
 */
export function setTransactionObject(transaction: Record<string, unknown>) {
  return {
    type: 'SET_TRANSACTION_OBJECT' as const,
    transaction,
  };
}

/**
 * Sets the current transaction ID only.
 *
 * @param {object} transactionId - Id of the current transaction.
 */
export function setTransactionId(transactionId: string) {
  return {
    type: 'SET_TRANSACTION_ID' as const,
    transactionId,
  };
}

/**
 * Enable selectable tokens (ERC20 and Ether) to send in a transaction
 *
 * @param {object} asset - Asset to start the transaction with
 */
export function setTokensTransaction(asset: SelectedAsset) {
  return {
    type: 'SET_TOKENS_TRANSACTION' as const,
    asset,
  };
}

/**
 * Enable Ether only to send in a transaction
 *
 * @param {object} transaction - Transaction additional object
 */
export function setEtherTransaction(transaction: Record<string, unknown>) {
  return {
    type: 'SET_ETHER_TRANSACTION' as const,
    transaction,
  };
}

export function setNonce(nonce: string) {
  return {
    type: 'SET_NONCE' as const,
    nonce,
  };
}

export function setProposedNonce(proposedNonce: string) {
  return {
    type: 'SET_PROPOSED_NONCE' as const,
    proposedNonce,
  };
}

export function setMaxValueMode(maxValueMode: boolean) {
  return {
    type: 'SET_MAX_VALUE_MODE' as const,
    maxValueMode,
  };
}

export function setTransactionValue(value: string) {
  return {
    type: 'SET_TRANSACTION_VALUE' as const,
    value,
  };
}
