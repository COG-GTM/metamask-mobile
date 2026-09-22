import TransactionTypes from '../../core/TransactionTypes';

const {
  ASSET: { ETH, ERC20, ERC721 },
} = TransactionTypes;

interface TransactionAsset {
  isETH?: boolean;
  tokenId?: unknown;
}

export interface TransactionAction {
  type: string;
  selectedAsset?: object;
  assetType?: string;
  from?: string;
  to?: string;
  ensRecipient?: string;
  transactionToName?: string;
  transactionFromName?: string;
  transaction?: object;
  transactionId?: string | number;
  securityAlertResponse?: unknown;
  asset?: object;
  nonce?: number;
  proposedNonce?: number;
  maxValueMode?: boolean;
  value?: string;
}

/**
 * Clears transaction object completely
 */
export function resetTransaction(): TransactionAction {
  return {
    type: 'RESET_TRANSACTION',
  };
}

/**
 * Starts a new transaction state with an asset
 *
 * @param {object} selectedAsset - Asset to start the transaction with
 */
export function newAssetTransaction<T extends object>(
  selectedAsset: T,
): TransactionAction {
  const asset = selectedAsset as T & TransactionAsset;

  return {
    type: 'NEW_ASSET_TRANSACTION',
    selectedAsset,
    assetType: asset.isETH
      ? ETH
      : asset.tokenId
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
  ensRecipient?: string,
  transactionToName?: string,
  transactionFromName?: string,
): TransactionAction {
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
export function setSelectedAsset<T extends object>(
  selectedAsset: T,
): TransactionAction {
  const asset = selectedAsset as T & TransactionAsset;

  return {
    type: 'SET_SELECTED_ASSET',
    selectedAsset,
    assetType: asset.isETH
      ? ETH
      : asset.tokenId
      ? ERC721
      : ERC20,
  };
}

/**
 * Sets transaction object to be sent
 *
 * @param {object} transaction - Transaction object with from, to, data, gas, gasPrice, value
 */
export function prepareTransaction(transaction: object): TransactionAction {
  return {
    type: 'PREPARE_TRANSACTION',
    transaction,
  };
}

export function setTransactionSecurityAlertResponse(
  transactionId: string | number | undefined,
  securityAlertResponse: unknown,
): TransactionAction {
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
export function setTransactionObject(transaction: object): TransactionAction {
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
  transactionId: string | number,
): TransactionAction {
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
export function setTokensTransaction(asset: object): TransactionAction {
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
export function setEtherTransaction(transaction: object): TransactionAction {
  return {
    type: 'SET_ETHER_TRANSACTION',
    transaction,
  };
}

export function setNonce(nonce: number): TransactionAction {
  return {
    type: 'SET_NONCE',
    nonce,
  };
}

export function setProposedNonce(proposedNonce: number): TransactionAction {
  return {
    type: 'SET_PROPOSED_NONCE',
    proposedNonce,
  };
}

export function setMaxValueMode(maxValueMode: boolean): TransactionAction {
  return {
    type: 'SET_MAX_VALUE_MODE',
    maxValueMode,
  };
}

export function setTransactionValue(value: string): TransactionAction {
  return {
    type: 'SET_TRANSACTION_VALUE',
    value,
  };
}
