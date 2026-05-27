import TransactionTypes from '../../core/TransactionTypes';

const {
  ASSET: { ETH, ERC20, ERC721 },
} = TransactionTypes;

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

interface SecurityAlertResponse {
  [key: string]: unknown;
}

export function resetTransaction(): { type: 'RESET_TRANSACTION' } {
  return {
    type: 'RESET_TRANSACTION',
  };
}

export function newAssetTransaction(selectedAsset: SelectedAsset): { type: 'NEW_ASSET_TRANSACTION'; selectedAsset: SelectedAsset; assetType: string } {
  return {
    type: 'NEW_ASSET_TRANSACTION',
    selectedAsset,
    assetType: selectedAsset.isETH
      ? ETH
      : selectedAsset.tokenId
      ? ERC721
      : ERC20,
  };
}

export function setRecipient(
  from: string,
  to: string,
  ensRecipient: string,
  transactionToName: string,
  transactionFromName: string,
): { type: 'SET_RECIPIENT'; from: string; to: string; ensRecipient: string; transactionToName: string; transactionFromName: string } {
  return {
    type: 'SET_RECIPIENT',
    from,
    to,
    ensRecipient,
    transactionToName,
    transactionFromName,
  };
}

export function setSelectedAsset(selectedAsset: SelectedAsset): { type: 'SET_SELECTED_ASSET'; selectedAsset: SelectedAsset; assetType: string } {
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

export function prepareTransaction(transaction: TransactionObject): { type: 'PREPARE_TRANSACTION'; transaction: TransactionObject } {
  return {
    type: 'PREPARE_TRANSACTION',
    transaction,
  };
}

export function setTransactionSecurityAlertResponse(
  transactionId: string,
  securityAlertResponse: SecurityAlertResponse,
): { type: 'SET_TRANSACTION_SECURITY_ALERT_RESPONSE'; transactionId: string; securityAlertResponse: SecurityAlertResponse } {
  return {
    type: 'SET_TRANSACTION_SECURITY_ALERT_RESPONSE',
    transactionId,
    securityAlertResponse,
  };
}

export function setTransactionObject(transaction: TransactionObject): { type: 'SET_TRANSACTION_OBJECT'; transaction: TransactionObject } {
  return {
    type: 'SET_TRANSACTION_OBJECT',
    transaction,
  };
}

export function setTransactionId(transactionId: string): { type: 'SET_TRANSACTION_ID'; transactionId: string } {
  return {
    type: 'SET_TRANSACTION_ID',
    transactionId,
  };
}

export function setTokensTransaction(asset: SelectedAsset): { type: 'SET_TOKENS_TRANSACTION'; asset: SelectedAsset } {
  return {
    type: 'SET_TOKENS_TRANSACTION',
    asset,
  };
}

export function setEtherTransaction(transaction: TransactionObject): { type: 'SET_ETHER_TRANSACTION'; transaction: TransactionObject } {
  return {
    type: 'SET_ETHER_TRANSACTION',
    transaction,
  };
}

export function setNonce(nonce: string): { type: 'SET_NONCE'; nonce: string } {
  return {
    type: 'SET_NONCE',
    nonce,
  };
}

export function setProposedNonce(proposedNonce: string): { type: 'SET_PROPOSED_NONCE'; proposedNonce: string } {
  return {
    type: 'SET_PROPOSED_NONCE',
    proposedNonce,
  };
}

export function setMaxValueMode(maxValueMode: boolean): { type: 'SET_MAX_VALUE_MODE'; maxValueMode: boolean } {
  return {
    type: 'SET_MAX_VALUE_MODE',
    maxValueMode,
  };
}

export function setTransactionValue(value: string): { type: 'SET_TRANSACTION_VALUE'; value: string } {
  return {
    type: 'SET_TRANSACTION_VALUE',
    value,
  };
}
