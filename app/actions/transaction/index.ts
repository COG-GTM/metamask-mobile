import { type Action } from 'redux';
import type BN from 'bnjs4';
import TransactionTypes from '../../core/TransactionTypes';
import type { SecurityAlertResponse } from '@metamask/transaction-controller';
import type { SecurityAlertResponse as BlockaidSecurityAlertResponse } from '../../components/Views/confirmations/legacy/components/BlockaidBanner/BlockaidBanner.types';

const ETH = TransactionTypes.ASSET.ETH as TransactionAssetType;
const ERC20 = TransactionTypes.ASSET.ERC20 as TransactionAssetType;
const ERC721 = TransactionTypes.ASSET.ERC721 as TransactionAssetType;

export enum TransactionActionType {
  RESET_TRANSACTION = 'RESET_TRANSACTION',
  NEW_ASSET_TRANSACTION = 'NEW_ASSET_TRANSACTION',
  SET_RECIPIENT = 'SET_RECIPIENT',
  SET_SELECTED_ASSET = 'SET_SELECTED_ASSET',
  PREPARE_TRANSACTION = 'PREPARE_TRANSACTION',
  SET_TRANSACTION_SECURITY_ALERT_RESPONSE = 'SET_TRANSACTION_SECURITY_ALERT_RESPONSE',
  SET_TRANSACTION_OBJECT = 'SET_TRANSACTION_OBJECT',
  SET_TRANSACTION_ID = 'SET_TRANSACTION_ID',
  SET_TOKENS_TRANSACTION = 'SET_TOKENS_TRANSACTION',
  SET_ETHER_TRANSACTION = 'SET_ETHER_TRANSACTION',
  SET_NONCE = 'SET_NONCE',
  SET_PROPOSED_NONCE = 'SET_PROPOSED_NONCE',
  SET_MAX_VALUE_MODE = 'SET_MAX_VALUE_MODE',
  SET_TRANSACTION_VALUE = 'SET_TRANSACTION_VALUE',
}

export type TransactionAssetType = 'ETH' | 'ERC20' | 'ERC721' | 'ERC1155';

/**
 * Asset selected for a send flow. Assets come from many sources (tokens,
 * collectibles, native currency) so only the fields inspected by the
 * reducer/actions are typed.
 */
export interface TransactionSelectedAsset {
  isETH?: boolean;
  tokenId?: string | number;
  address?: string;
  symbol?: string;
  name?: string | null;
  decimals?: number | string | BN;
  contractName?: string | null;
}

/**
 * Standard transaction params (from, to, data, gas, gasPrice, value, ...)
 */
export interface TransactionParams {
  data?: string;
  from?: string;
  gas?: BN;
  gasPrice?: BN;
  to?: string;
  value?: BN;
  maxFeePerGas?: BN;
  maxPriorityFeePerGas?: BN;
  securityAlertResponse?: SecurityAlertResponse;
}

/**
 * Transaction params as held in redux state; the value may be replaced with a
 * hex string via setTransactionValue, and gas fields may be stored as hex
 * strings when they come straight from a gas estimate.
 */
export interface TransactionStateParams
  extends Omit<
    TransactionParams,
    'value' | 'gas' | 'gasPrice' | 'maxFeePerGas' | 'maxPriorityFeePerGas'
  > {
  value?: BN | string;
  gas?: BN | string;
  gasPrice?: BN | string;
  maxFeePerGas?: BN | string;
  maxPriorityFeePerGas?: BN | string;
}

/**
 * Transaction params plus any additional meta data (selectedAsset, id, etc.)
 */
export interface TransactionObject extends TransactionStateParams {
  selectedAsset?: TransactionSelectedAsset;
  assetType?: TransactionAssetType;
  [key: string]: unknown;
}

export type ResetTransactionAction =
  Action<TransactionActionType.RESET_TRANSACTION>;

export type NewAssetTransactionAction =
  Action<TransactionActionType.NEW_ASSET_TRANSACTION> & {
    selectedAsset: TransactionSelectedAsset;
    assetType: TransactionAssetType;
  };

export type SetRecipientAction = Action<TransactionActionType.SET_RECIPIENT> & {
  from: string;
  to: string;
  ensRecipient?: string;
  transactionToName?: string;
  transactionFromName?: string;
};

export type SetSelectedAssetAction =
  Action<TransactionActionType.SET_SELECTED_ASSET> & {
    selectedAsset: TransactionSelectedAsset;
    assetType: TransactionAssetType;
  };

export type PrepareTransactionAction =
  Action<TransactionActionType.PREPARE_TRANSACTION> & {
    transaction: TransactionStateParams;
  };

export type SetTransactionSecurityAlertResponseAction =
  Action<TransactionActionType.SET_TRANSACTION_SECURITY_ALERT_RESPONSE> & {
    transactionId: string | undefined;
    securityAlertResponse: BlockaidSecurityAlertResponse;
  };

export type SetTransactionObjectAction =
  Action<TransactionActionType.SET_TRANSACTION_OBJECT> & {
    transaction: TransactionObject;
  };

export type SetTransactionIdAction =
  Action<TransactionActionType.SET_TRANSACTION_ID> & {
    transactionId: string;
  };

export type SetTokensTransactionAction =
  Action<TransactionActionType.SET_TOKENS_TRANSACTION> & {
    asset: TransactionSelectedAsset;
  };

export type SetEtherTransactionAction =
  Action<TransactionActionType.SET_ETHER_TRANSACTION> & {
    transaction: TransactionObject;
  };

export type SetNonceAction = Action<TransactionActionType.SET_NONCE> & {
  nonce: number;
};

export type SetProposedNonceAction =
  Action<TransactionActionType.SET_PROPOSED_NONCE> & {
    proposedNonce: number;
  };

export type SetMaxValueModeAction =
  Action<TransactionActionType.SET_MAX_VALUE_MODE> & {
    maxValueMode: boolean;
  };

export type SetTransactionValueAction =
  Action<TransactionActionType.SET_TRANSACTION_VALUE> & {
    value: BN | string;
  };

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
    type: TransactionActionType.RESET_TRANSACTION,
  };
}

/**
 * Starts a new transaction state with an asset
 *
 * @param selectedAsset - Asset to start the transaction with
 */
export function newAssetTransaction(
  selectedAsset: TransactionSelectedAsset,
): NewAssetTransactionAction {
  return {
    type: TransactionActionType.NEW_ASSET_TRANSACTION,
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
    type: TransactionActionType.SET_RECIPIENT,
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
  selectedAsset: TransactionSelectedAsset,
): SetSelectedAssetAction {
  return {
    type: TransactionActionType.SET_SELECTED_ASSET,
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
  transaction: TransactionStateParams,
): PrepareTransactionAction {
  return {
    type: TransactionActionType.PREPARE_TRANSACTION,
    transaction,
  };
}

export function setTransactionSecurityAlertResponse(
  transactionId: string | undefined,
  securityAlertResponse: BlockaidSecurityAlertResponse,
): SetTransactionSecurityAlertResponseAction {
  return {
    type: TransactionActionType.SET_TRANSACTION_SECURITY_ALERT_RESPONSE,
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
    type: TransactionActionType.SET_TRANSACTION_OBJECT,
    transaction,
  };
}

/**
 * Sets the current transaction ID only.
 *
 * @param transactionId - Id of the current transaction.
 */
export function setTransactionId(transactionId: string): SetTransactionIdAction {
  return {
    type: TransactionActionType.SET_TRANSACTION_ID,
    transactionId,
  };
}

/**
 * Enable selectable tokens (ERC20 and Ether) to send in a transaction
 *
 * @param asset - Asset to start the transaction with
 */
export function setTokensTransaction(
  asset: TransactionSelectedAsset,
): SetTokensTransactionAction {
  return {
    type: TransactionActionType.SET_TOKENS_TRANSACTION,
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
    type: TransactionActionType.SET_ETHER_TRANSACTION,
    transaction,
  };
}

export function setNonce(nonce: number): SetNonceAction {
  return {
    type: TransactionActionType.SET_NONCE,
    nonce,
  };
}

export function setProposedNonce(proposedNonce: number): SetProposedNonceAction {
  return {
    type: TransactionActionType.SET_PROPOSED_NONCE,
    proposedNonce,
  };
}

export function setMaxValueMode(maxValueMode: boolean): SetMaxValueModeAction {
  return {
    type: TransactionActionType.SET_MAX_VALUE_MODE,
    maxValueMode,
  };
}

export function setTransactionValue(
  value: BN | string,
): SetTransactionValueAction {
  return {
    type: TransactionActionType.SET_TRANSACTION_VALUE,
    value,
  };
}
