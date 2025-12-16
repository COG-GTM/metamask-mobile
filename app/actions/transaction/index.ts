import TransactionTypes from '../../core/TransactionTypes';

const {
  ASSET: { ETH, ERC20, ERC721 },
} = TransactionTypes;

interface SelectedAsset {
  isETH?: boolean;
  tokenId?: string;
  address?: string;
  symbol?: string;
  decimals?: number;
  image?: string;
  name?: string;
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
  result_type?: string;
  reason?: string;
  features?: string[];
  [key: string]: unknown;
}

type AssetType = typeof ETH | typeof ERC20 | typeof ERC721;

interface ResetTransactionAction {
  type: 'RESET_TRANSACTION';
}

interface NewAssetTransactionAction {
  type: 'NEW_ASSET_TRANSACTION';
  selectedAsset: SelectedAsset;
  assetType: AssetType;
}

interface SetRecipientAction {
  type: 'SET_RECIPIENT';
  from: string;
  to: string;
  ensRecipient?: string;
  transactionToName?: string;
  transactionFromName?: string;
}

interface SetSelectedAssetAction {
  type: 'SET_SELECTED_ASSET';
  selectedAsset: SelectedAsset;
  assetType: AssetType;
}

interface PrepareTransactionAction {
  type: 'PREPARE_TRANSACTION';
  transaction: TransactionObject;
}

interface SetTransactionSecurityAlertResponseAction {
  type: 'SET_TRANSACTION_SECURITY_ALERT_RESPONSE';
  transactionId: string;
  securityAlertResponse: SecurityAlertResponse;
}

interface SetTransactionObjectAction {
  type: 'SET_TRANSACTION_OBJECT';
  transaction: TransactionObject;
}

interface SetTransactionIdAction {
  type: 'SET_TRANSACTION_ID';
  transactionId: string;
}

interface SetTokensTransactionAction {
  type: 'SET_TOKENS_TRANSACTION';
  asset: SelectedAsset;
}

interface SetEtherTransactionAction {
  type: 'SET_ETHER_TRANSACTION';
  transaction: TransactionObject;
}

interface SetNonceAction {
  type: 'SET_NONCE';
  nonce: string;
}

interface SetProposedNonceAction {
  type: 'SET_PROPOSED_NONCE';
  proposedNonce: string;
}

interface SetMaxValueModeAction {
  type: 'SET_MAX_VALUE_MODE';
  maxValueMode: boolean;
}

interface SetTransactionValueAction {
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

export function resetTransaction(): ResetTransactionAction {
  return {
    type: 'RESET_TRANSACTION',
  };
}

export function newAssetTransaction(
  selectedAsset: SelectedAsset,
): NewAssetTransactionAction {
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

export function prepareTransaction(
  transaction: TransactionObject,
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

export function setTransactionObject(
  transaction: TransactionObject,
): SetTransactionObjectAction {
  return {
    type: 'SET_TRANSACTION_OBJECT',
    transaction,
  };
}

export function setTransactionId(transactionId: string): SetTransactionIdAction {
  return {
    type: 'SET_TRANSACTION_ID',
    transactionId,
  };
}

export function setTokensTransaction(
  asset: SelectedAsset,
): SetTokensTransactionAction {
  return {
    type: 'SET_TOKENS_TRANSACTION',
    asset,
  };
}

export function setEtherTransaction(
  transaction: TransactionObject,
): SetEtherTransactionAction {
  return {
    type: 'SET_ETHER_TRANSACTION',
    transaction,
  };
}

export function setNonce(nonce: string): SetNonceAction {
  return {
    type: 'SET_NONCE',
    nonce,
  };
}

export function setProposedNonce(proposedNonce: string): SetProposedNonceAction {
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
