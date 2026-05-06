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

export interface SelectedAsset {
  isETH?: boolean;
  isNative?: boolean;
  tokenId?: string;
  symbol?: string;
  address?: string;
  decimals?: number;
  name?: string | null;
  logo?: string | null;
  contractName?: string | null;
  standard?: string | null;
  image?: string | string[] | null;
  description?: string | null;
  chainId?: string | number;
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
  selectedAsset?: SelectedAsset;
  assetType?: string;
  id?: string;
  symbol?: string;
  ensRecipient?: string;
  transactionTo?: string;
  transactionToName?: string;
  transactionFromName?: string;
  paymentRequest?: boolean;
  readableValue?: string;
  type?: string;
  proposedNonce?: string;
  nonce?: string;
  warningGasPriceHigh?: string;
  transactionValue?: string;
}

// Permissive type to accept any security alert response shape from callers.
// Reducers only store this value and do not read its fields.
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SecurityAlertResponse {}

type TransactionIdParam = string | undefined;

export interface ResetTransactionAction {
  type: typeof RESET_TRANSACTION;
}

export interface NewAssetTransactionAction {
  type: typeof NEW_ASSET_TRANSACTION;
  selectedAsset: SelectedAsset;
  assetType: string;
}

export interface SetRecipientAction {
  type: typeof SET_RECIPIENT;
  from: string;
  to: string;
  ensRecipient?: string;
  transactionToName?: string;
  transactionFromName?: string;
}

export interface SetSelectedAssetAction {
  type: typeof SET_SELECTED_ASSET;
  selectedAsset: SelectedAsset;
  assetType: string;
}

export interface PrepareTransactionAction {
  type: typeof PREPARE_TRANSACTION;
  transaction: TransactionData;
}

export interface SetTransactionSecurityAlertResponseAction {
  type: typeof SET_TRANSACTION_SECURITY_ALERT_RESPONSE;
  transactionId: TransactionIdParam;
  securityAlertResponse: SecurityAlertResponse;
}

export interface SetTransactionObjectAction {
  type: typeof SET_TRANSACTION_OBJECT;
  transaction: TransactionData;
}

export interface SetTransactionIdAction {
  type: typeof SET_TRANSACTION_ID;
  transactionId: TransactionIdParam;
}

export interface SetTokensTransactionAction {
  type: typeof SET_TOKENS_TRANSACTION;
  asset: SelectedAsset;
}

export interface SetEtherTransactionAction {
  type: typeof SET_ETHER_TRANSACTION;
  transaction: TransactionData;
}

export interface SetNonceAction {
  type: typeof SET_NONCE;
  nonce: string | undefined;
}

export interface SetProposedNonceAction {
  type: typeof SET_PROPOSED_NONCE;
  proposedNonce: string | undefined;
}

export interface SetMaxValueModeAction {
  type: typeof SET_MAX_VALUE_MODE;
  maxValueMode: boolean;
}

export interface SetTransactionValueAction {
  type: typeof SET_TRANSACTION_VALUE;
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

/**
 * Clears transaction object completely
 */
export function resetTransaction(): ResetTransactionAction {
  return {
    type: RESET_TRANSACTION,
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
  ensRecipient?: string,
  transactionToName?: string,
  transactionFromName?: string,
): SetRecipientAction {
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
export function setSelectedAsset(
  selectedAsset: SelectedAsset,
): SetSelectedAssetAction {
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
export function prepareTransaction(
  transaction: TransactionData,
): PrepareTransactionAction {
  return {
    type: PREPARE_TRANSACTION,
    transaction,
  };
}

export function setTransactionSecurityAlertResponse(
  transactionId: TransactionIdParam,
  securityAlertResponse: SecurityAlertResponse,
): SetTransactionSecurityAlertResponseAction {
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
export function setTransactionObject(
  transaction: TransactionData,
): SetTransactionObjectAction {
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
export function setTransactionId(
  transactionId: TransactionIdParam,
): SetTransactionIdAction {
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
export function setTokensTransaction(
  asset: SelectedAsset,
): SetTokensTransactionAction {
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
export function setEtherTransaction(
  transaction: TransactionData,
): SetEtherTransactionAction {
  return {
    type: SET_ETHER_TRANSACTION,
    transaction,
  };
}

export function setNonce(nonce: string | undefined): SetNonceAction {
  return {
    type: SET_NONCE,
    nonce,
  };
}

export function setProposedNonce(
  proposedNonce: string | undefined,
): SetProposedNonceAction {
  return {
    type: SET_PROPOSED_NONCE,
    proposedNonce,
  };
}

export function setMaxValueMode(maxValueMode: boolean): SetMaxValueModeAction {
  return {
    type: SET_MAX_VALUE_MODE,
    maxValueMode,
  };
}

export function setTransactionValue(value: string): SetTransactionValueAction {
  return {
    type: SET_TRANSACTION_VALUE,
    value,
  };
}
