/* eslint-disable @typescript-eslint/default-param-last */
import { REHYDRATE } from 'redux-persist';
import { SecurityAlertResponse } from '@metamask/transaction-controller';
import { getTxData, getTxMeta } from '../../util/transaction-reducer-helpers';

type TxMeta = NonNullable<Parameters<typeof getTxMeta>[0]>;

export interface TransactionSelectedAsset {
  tokenId?: string;
  isETH?: boolean;
  symbol?: string;
  [key: string]: unknown;
}

export interface TransactionObject extends TxMeta {
  selectedAsset?: TransactionSelectedAsset;
  assetType?: string;
  [key: string]: unknown;
}

export interface TransactionState {
  ensRecipient?: string;
  assetType?: string;
  selectedAsset: TransactionSelectedAsset;
  transaction: Partial<TxMeta>;
  warningGasPriceHigh?: string;
  transactionTo?: string;
  transactionToName?: string;
  transactionFromName?: string;
  transactionValue?: string;
  symbol?: string;
  paymentRequest?: boolean;
  readableValue?: string;
  id?: string;
  type?: string;
  proposedNonce?: number;
  nonce?: number;
  securityAlertResponses: Record<string, SecurityAlertResponse>;
  useMax: boolean;
  maxValueMode?: boolean;
  [key: string]: unknown;
}

export type TransactionAction =
  | { type: typeof REHYDRATE }
  | { type: 'RESET_TRANSACTION' }
  | {
      type: 'NEW_ASSET_TRANSACTION';
      selectedAsset: TransactionSelectedAsset;
      assetType?: string;
    }
  | { type: 'SET_NONCE'; nonce?: number }
  | { type: 'SET_PROPOSED_NONCE'; proposedNonce?: number }
  | {
      type: 'SET_RECIPIENT';
      from?: string;
      to?: string;
      ensRecipient?: string;
      transactionToName?: string;
      transactionFromName?: string;
    }
  | {
      type: 'SET_SELECTED_ASSET';
      selectedAsset: TransactionSelectedAsset;
      assetType?: string;
    }
  | { type: 'PREPARE_TRANSACTION'; transaction: Partial<TxMeta> }
  | { type: 'SET_TRANSACTION_OBJECT'; transaction: TransactionObject }
  | { type: 'SET_TOKENS_TRANSACTION'; asset: TransactionSelectedAsset }
  | { type: 'SET_ETHER_TRANSACTION'; transaction: TransactionObject }
  | {
      type: 'SET_TRANSACTION_SECURITY_ALERT_RESPONSE';
      transactionId: string;
      securityAlertResponse: SecurityAlertResponse;
    }
  | { type: 'SET_TRANSACTION_ID'; transactionId?: string }
  | { type: 'SET_MAX_VALUE_MODE'; maxValueMode: boolean }
  | { type: 'SET_TRANSACTION_VALUE'; value?: TxMeta['value'] };

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
    // eip1559
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

const getAssetType = (selectedAsset?: TransactionSelectedAsset) => {
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
  state = initialState,
  action: TransactionAction,
): TransactionState => {
  switch (action.type) {
    case REHYDRATE:
      return {
        ...initialState,
      };
    case 'RESET_TRANSACTION':
      return {
        ...initialState,
      };
    case 'NEW_ASSET_TRANSACTION':
      return {
        ...state,
        ...initialState,
        selectedAsset: action.selectedAsset,
        assetType: action.assetType,
      };
    case 'SET_NONCE':
      return {
        ...state,
        nonce: action.nonce,
      };
    case 'SET_PROPOSED_NONCE':
      return {
        ...state,
        proposedNonce: action.proposedNonce,
      };
    case 'SET_RECIPIENT':
      return {
        ...state,
        transaction: { ...state.transaction, from: action.from },
        ensRecipient: action.ensRecipient,
        transactionTo: action.to,
        transactionToName: action.transactionToName,
        transactionFromName: action.transactionFromName,
      };
    case 'SET_SELECTED_ASSET': {
      const selectedAsset = action.selectedAsset;
      const assetType = action.assetType || getAssetType(selectedAsset);
      return {
        ...state,
        selectedAsset,
        assetType,
      };
    }
    case 'PREPARE_TRANSACTION':
      return {
        ...state,
        transaction: action.transaction,
      };
    case 'SET_TRANSACTION_OBJECT': {
      const selectedAsset = action.transaction.selectedAsset;
      if (selectedAsset) {
        const assetType = getAssetType(selectedAsset);
        action.transaction.assetType = assetType;
      }
      const txMeta = getTxMeta(action.transaction);
      return {
        ...state,
        transaction: {
          ...state.transaction,
          ...getTxData(action.transaction),
        },
        ...txMeta,
        // Retain the securityAlertResponses from the old state
        securityAlertResponses: state.securityAlertResponses,
      };
    }
    case 'SET_TOKENS_TRANSACTION': {
      const selectedAsset = action.asset;
      const assetType = getAssetType(selectedAsset);
      return {
        ...state,
        selectedAsset: action.asset,
        assetType,
      };
    }
    case 'SET_ETHER_TRANSACTION':
      return {
        ...state,
        symbol: 'ETH',
        assetType: 'ETH',
        selectedAsset: { isETH: true, symbol: 'ETH' },
        ...getTxMeta(action.transaction),
        transaction: getTxData(action.transaction),
      };
    case 'SET_TRANSACTION_SECURITY_ALERT_RESPONSE': {
      const { transactionId, securityAlertResponse } = action;
      return {
        ...state,
        securityAlertResponses: {
          ...state.securityAlertResponses,
          [transactionId]: securityAlertResponse,
        },
      };
    }
    case 'SET_TRANSACTION_ID': {
      const { transactionId } = action;
      return {
        ...state,
        id: transactionId,
      };
    }
    case 'SET_MAX_VALUE_MODE': {
      return {
        ...state,
        maxValueMode: action.maxValueMode,
      };
    }
    case 'SET_TRANSACTION_VALUE': {
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
