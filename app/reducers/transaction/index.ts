import { REHYDRATE } from 'redux-persist';
import { getTxData, getTxMeta } from '../../util/transaction-reducer-helpers';
import { SecurityAlertResponse } from '@metamask/transaction-controller';
import type BN from 'bnjs4';

export const RESET_TRANSACTION = 'RESET_TRANSACTION';
export const NEW_ASSET_TRANSACTION = 'NEW_ASSET_TRANSACTION';
export const SET_NONCE = 'SET_NONCE';
export const SET_PROPOSED_NONCE = 'SET_PROPOSED_NONCE';
export const SET_RECIPIENT = 'SET_RECIPIENT';
export const SET_SELECTED_ASSET = 'SET_SELECTED_ASSET';
export const PREPARE_TRANSACTION = 'PREPARE_TRANSACTION';
export const SET_TRANSACTION_OBJECT = 'SET_TRANSACTION_OBJECT';
export const SET_TOKENS_TRANSACTION = 'SET_TOKENS_TRANSACTION';
export const SET_ETHER_TRANSACTION = 'SET_ETHER_TRANSACTION';
export const SET_TRANSACTION_SECURITY_ALERT_RESPONSE =
  'SET_TRANSACTION_SECURITY_ALERT_RESPONSE';
export const SET_TRANSACTION_ID = 'SET_TRANSACTION_ID';
export const SET_MAX_VALUE_MODE = 'SET_MAX_VALUE_MODE';
export const SET_TRANSACTION_VALUE = 'SET_TRANSACTION_VALUE';

export interface SelectedAsset {
  tokenId?: string;
  isETH?: boolean;
  symbol?: string;
  address?: string;
  decimals?: number;
  image?: string;
  name?: string;
  standard?: string;
}

export interface TransactionData {
  data?: string;
  from?: string;
  gas?: BN;
  gasPrice?: BN;
  to?: string;
  value?: BN;
  maxFeePerGas?: BN;
  maxPriorityFeePerGas?: BN;
}

export interface TransactionState {
  ensRecipient: string | undefined;
  assetType: string | undefined;
  selectedAsset: SelectedAsset;
  transaction: TransactionData;
  warningGasPriceHigh: string | undefined;
  transactionTo: string | undefined;
  transactionToName: string | undefined;
  transactionFromName: string | undefined;
  transactionValue: string | undefined;
  symbol: string | undefined;
  paymentRequest: unknown;
  readableValue: string | undefined;
  id: string | undefined;
  type: string | undefined;
  proposedNonce: string | undefined;
  nonce: string | undefined;
  securityAlertResponses: Record<string, SecurityAlertResponse>;
  useMax: boolean;
  maxValueMode?: boolean;
}

interface RehydrateAction {
  type: typeof REHYDRATE;
}

interface ResetTransactionAction {
  type: typeof RESET_TRANSACTION;
}

interface NewAssetTransactionAction {
  type: typeof NEW_ASSET_TRANSACTION;
  selectedAsset: SelectedAsset;
  assetType: string;
}

interface SetNonceAction {
  type: typeof SET_NONCE;
  nonce: string;
}

interface SetProposedNonceAction {
  type: typeof SET_PROPOSED_NONCE;
  proposedNonce: string;
}

interface SetRecipientAction {
  type: typeof SET_RECIPIENT;
  from?: string;
  ensRecipient?: string;
  to?: string;
  transactionToName?: string;
  transactionFromName?: string;
}

interface SetSelectedAssetAction {
  type: typeof SET_SELECTED_ASSET;
  selectedAsset: SelectedAsset;
  assetType?: string;
}

interface PrepareTransactionAction {
  type: typeof PREPARE_TRANSACTION;
  transaction: TransactionData;
}

interface SetTransactionObjectAction {
  type: typeof SET_TRANSACTION_OBJECT;
  transaction: TransactionData & {
    selectedAsset?: SelectedAsset;
    assetType?: string;
  };
}

interface SetTokensTransactionAction {
  type: typeof SET_TOKENS_TRANSACTION;
  asset: SelectedAsset;
}

interface SetEtherTransactionAction {
  type: typeof SET_ETHER_TRANSACTION;
  transaction: TransactionData;
}

interface SetTransactionSecurityAlertResponseAction {
  type: typeof SET_TRANSACTION_SECURITY_ALERT_RESPONSE;
  transactionId: string;
  securityAlertResponse: SecurityAlertResponse;
}

interface SetTransactionIdAction {
  type: typeof SET_TRANSACTION_ID;
  transactionId: string;
}

interface SetMaxValueModeAction {
  type: typeof SET_MAX_VALUE_MODE;
  maxValueMode: boolean;
}

interface SetTransactionValueAction {
  type: typeof SET_TRANSACTION_VALUE;
  value: BN;
}

type TransactionAction =
  | RehydrateAction
  | ResetTransactionAction
  | NewAssetTransactionAction
  | SetNonceAction
  | SetProposedNonceAction
  | SetRecipientAction
  | SetSelectedAssetAction
  | PrepareTransactionAction
  | SetTransactionObjectAction
  | SetTokensTransactionAction
  | SetEtherTransactionAction
  | SetTransactionSecurityAlertResponseAction
  | SetTransactionIdAction
  | SetMaxValueModeAction
  | SetTransactionValueAction;

const initialState: TransactionState = {
  ensRecipient: undefined,
  assetType: undefined,
  selectedAsset: {},
  transaction: {
    data: undefined,
    from: undefined,
    gas: undefined,
    gasPrice: undefined,
    to: undefined,
    value: undefined,
    maxFeePerGas: undefined,
    maxPriorityFeePerGas: undefined,
  },
  warningGasPriceHigh: undefined,
  transactionTo: undefined,
  transactionToName: undefined,
  transactionFromName: undefined,
  transactionValue: undefined,
  symbol: undefined,
  paymentRequest: undefined,
  readableValue: undefined,
  id: undefined,
  type: undefined,
  proposedNonce: undefined,
  nonce: undefined,
  securityAlertResponses: {},
  useMax: false,
};

const getAssetType = (selectedAsset: SelectedAsset): string | undefined => {
  let assetType: string | undefined;
  if (selectedAsset) {
    if (selectedAsset.tokenId) {
      assetType = 'ERC721';
    } else if (selectedAsset.isETH) {
      assetType = 'ETH';
    } else {
      assetType = 'ERC20';
    }
  }
  return assetType;
};

const transactionReducer = (
  state: TransactionState = initialState,
  action: TransactionAction,
): TransactionState => {
  switch (action.type) {
    case REHYDRATE:
      return {
        ...initialState,
      };
    case RESET_TRANSACTION:
      return {
        ...initialState,
      };
    case NEW_ASSET_TRANSACTION:
      return {
        ...state,
        ...initialState,
        selectedAsset: action.selectedAsset,
        assetType: action.assetType,
      };
    case SET_NONCE:
      return {
        ...state,
        nonce: action.nonce,
      };
    case SET_PROPOSED_NONCE:
      return {
        ...state,
        proposedNonce: action.proposedNonce,
      };
    case SET_RECIPIENT:
      return {
        ...state,
        transaction: { ...state.transaction, from: action.from },
        ensRecipient: action.ensRecipient,
        transactionTo: action.to,
        transactionToName: action.transactionToName,
        transactionFromName: action.transactionFromName,
      };
    case SET_SELECTED_ASSET: {
      const selectedAsset = action.selectedAsset;
      const assetType = action.assetType || getAssetType(selectedAsset);
      return {
        ...state,
        selectedAsset,
        assetType,
      };
    }
    case PREPARE_TRANSACTION:
      return {
        ...state,
        transaction: action.transaction,
      };
    case SET_TRANSACTION_OBJECT: {
      const selectedAsset = action.transaction.selectedAsset;
      const transactionWithAssetType = { ...action.transaction };
      if (selectedAsset) {
        const assetType = getAssetType(selectedAsset);
        transactionWithAssetType.assetType = assetType;
      }
      const txMeta = getTxMeta(transactionWithAssetType);
      return {
        ...state,
        transaction: {
          ...state.transaction,
          ...getTxData(transactionWithAssetType),
        },
        ...txMeta,
        securityAlertResponses: state.securityAlertResponses,
      };
    }
    case SET_TOKENS_TRANSACTION: {
      const selectedAsset = action.asset;
      const assetType = getAssetType(selectedAsset);
      return {
        ...state,
        selectedAsset: action.asset,
        assetType,
      };
    }
    case SET_ETHER_TRANSACTION:
      return {
        ...state,
        symbol: 'ETH',
        assetType: 'ETH',
        selectedAsset: { isETH: true, symbol: 'ETH' },
        ...getTxMeta(action.transaction),
        transaction: getTxData(action.transaction) as TransactionData,
      };
    case SET_TRANSACTION_SECURITY_ALERT_RESPONSE: {
      const { transactionId, securityAlertResponse } = action;
      return {
        ...state,
        securityAlertResponses: {
          ...state.securityAlertResponses,
          [transactionId]: securityAlertResponse,
        },
      };
    }
    case SET_TRANSACTION_ID: {
      const { transactionId } = action;
      return {
        ...state,
        id: transactionId,
      };
    }
    case SET_MAX_VALUE_MODE: {
      return {
        ...state,
        maxValueMode: action.maxValueMode,
      };
    }
    case SET_TRANSACTION_VALUE: {
      return {
        ...state,
        transaction: { ...state.transaction, value: action.value },
      };
    }
    default:
      return state;
  }
};

export default transactionReducer;
