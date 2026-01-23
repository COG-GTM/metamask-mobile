import TransactionTypes from '../../core/TransactionTypes';

const {
  ASSET: { ETH, ERC20, ERC721 },
} = TransactionTypes;

export const TransactionActionTypes = {
  RESET_TRANSACTION: 'RESET_TRANSACTION',
  NEW_ASSET_TRANSACTION: 'NEW_ASSET_TRANSACTION',
  SET_RECIPIENT: 'SET_RECIPIENT',
  SET_SELECTED_ASSET: 'SET_SELECTED_ASSET',
  PREPARE_TRANSACTION: 'PREPARE_TRANSACTION',
  SET_TRANSACTION_SECURITY_ALERT_RESPONSE:
    'SET_TRANSACTION_SECURITY_ALERT_RESPONSE',
  SET_TRANSACTION_OBJECT: 'SET_TRANSACTION_OBJECT',
  SET_TRANSACTION_ID: 'SET_TRANSACTION_ID',
  SET_TOKENS_TRANSACTION: 'SET_TOKENS_TRANSACTION',
  SET_ETHER_TRANSACTION: 'SET_ETHER_TRANSACTION',
  SET_NONCE: 'SET_NONCE',
  SET_PROPOSED_NONCE: 'SET_PROPOSED_NONCE',
  SET_MAX_VALUE_MODE: 'SET_MAX_VALUE_MODE',
  SET_TRANSACTION_VALUE: 'SET_TRANSACTION_VALUE',
} as const;

export type AssetType = 'ETH' | 'ERC20' | 'ERC721' | 'ERC1155';

export interface SelectedAsset {
  isETH?: boolean;
  tokenId?: string;
  address?: string;
  symbol?: string;
  decimals?: number;
  image?: string;
  name?: string;
  standard?: string;
}

export interface TransactionData {
  data?: string;
  from?: string;
  gas?: string;
  gasPrice?: string;
  to?: string;
  value?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
}

export interface SecurityAlertResponse {
  result_type?: string;
  reason?: string;
  description?: string;
  features?: string[];
}

export interface ResetTransactionAction {
  type: typeof TransactionActionTypes.RESET_TRANSACTION;
}

export interface NewAssetTransactionAction {
  type: typeof TransactionActionTypes.NEW_ASSET_TRANSACTION;
  selectedAsset: SelectedAsset;
  assetType: AssetType;
}

export interface SetRecipientAction {
  type: typeof TransactionActionTypes.SET_RECIPIENT;
  from: string;
  to: string;
  ensRecipient?: string;
  transactionToName?: string;
  transactionFromName?: string;
}

export interface SetSelectedAssetAction {
  type: typeof TransactionActionTypes.SET_SELECTED_ASSET;
  selectedAsset: SelectedAsset;
  assetType: AssetType;
}

export interface PrepareTransactionAction {
  type: typeof TransactionActionTypes.PREPARE_TRANSACTION;
  transaction: TransactionData;
}

export interface SetTransactionSecurityAlertResponseAction {
  type: typeof TransactionActionTypes.SET_TRANSACTION_SECURITY_ALERT_RESPONSE;
  transactionId: string;
  securityAlertResponse: SecurityAlertResponse;
}

export interface SetTransactionObjectAction {
  type: typeof TransactionActionTypes.SET_TRANSACTION_OBJECT;
  transaction: TransactionData & {
    selectedAsset?: SelectedAsset;
    assetType?: AssetType;
  };
}

export interface SetTransactionIdAction {
  type: typeof TransactionActionTypes.SET_TRANSACTION_ID;
  transactionId: string;
}

export interface SetTokensTransactionAction {
  type: typeof TransactionActionTypes.SET_TOKENS_TRANSACTION;
  asset: SelectedAsset;
}

export interface SetEtherTransactionAction {
  type: typeof TransactionActionTypes.SET_ETHER_TRANSACTION;
  transaction: TransactionData;
}

export interface SetNonceAction {
  type: typeof TransactionActionTypes.SET_NONCE;
  nonce: string;
}

export interface SetProposedNonceAction {
  type: typeof TransactionActionTypes.SET_PROPOSED_NONCE;
  proposedNonce: string;
}

export interface SetMaxValueModeAction {
  type: typeof TransactionActionTypes.SET_MAX_VALUE_MODE;
  maxValueMode: boolean;
}

export interface SetTransactionValueAction {
  type: typeof TransactionActionTypes.SET_TRANSACTION_VALUE;
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

function getAssetType(selectedAsset: SelectedAsset): AssetType {
  if (selectedAsset.isETH) {
    return ETH as AssetType;
  }
  if (selectedAsset.tokenId) {
    return ERC721 as AssetType;
  }
  return ERC20 as AssetType;
}

export function resetTransaction(): ResetTransactionAction {
  return {
    type: TransactionActionTypes.RESET_TRANSACTION,
  };
}

export function newAssetTransaction(
  selectedAsset: SelectedAsset,
): NewAssetTransactionAction {
  return {
    type: TransactionActionTypes.NEW_ASSET_TRANSACTION,
    selectedAsset,
    assetType: getAssetType(selectedAsset),
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
    type: TransactionActionTypes.SET_RECIPIENT,
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
    type: TransactionActionTypes.SET_SELECTED_ASSET,
    selectedAsset,
    assetType: getAssetType(selectedAsset),
  };
}

export function prepareTransaction(
  transaction: TransactionData,
): PrepareTransactionAction {
  return {
    type: TransactionActionTypes.PREPARE_TRANSACTION,
    transaction,
  };
}

export function setTransactionSecurityAlertResponse(
  transactionId: string,
  securityAlertResponse: SecurityAlertResponse,
): SetTransactionSecurityAlertResponseAction {
  return {
    type: TransactionActionTypes.SET_TRANSACTION_SECURITY_ALERT_RESPONSE,
    transactionId,
    securityAlertResponse,
  };
}

export function setTransactionObject(
  transaction: TransactionData & {
    selectedAsset?: SelectedAsset;
    assetType?: AssetType;
  },
): SetTransactionObjectAction {
  return {
    type: TransactionActionTypes.SET_TRANSACTION_OBJECT,
    transaction,
  };
}

export function setTransactionId(transactionId: string): SetTransactionIdAction {
  return {
    type: TransactionActionTypes.SET_TRANSACTION_ID,
    transactionId,
  };
}

export function setTokensTransaction(
  asset: SelectedAsset,
): SetTokensTransactionAction {
  return {
    type: TransactionActionTypes.SET_TOKENS_TRANSACTION,
    asset,
  };
}

export function setEtherTransaction(
  transaction: TransactionData,
): SetEtherTransactionAction {
  return {
    type: TransactionActionTypes.SET_ETHER_TRANSACTION,
    transaction,
  };
}

export function setNonce(nonce: string): SetNonceAction {
  return {
    type: TransactionActionTypes.SET_NONCE,
    nonce,
  };
}

export function setProposedNonce(proposedNonce: string): SetProposedNonceAction {
  return {
    type: TransactionActionTypes.SET_PROPOSED_NONCE,
    proposedNonce,
  };
}

export function setMaxValueMode(maxValueMode: boolean): SetMaxValueModeAction {
  return {
    type: TransactionActionTypes.SET_MAX_VALUE_MODE,
    maxValueMode,
  };
}

export function setTransactionValue(value: string): SetTransactionValueAction {
  return {
    type: TransactionActionTypes.SET_TRANSACTION_VALUE,
    value,
  };
}
