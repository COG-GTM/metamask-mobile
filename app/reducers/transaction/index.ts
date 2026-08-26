/* eslint-disable @typescript-eslint/default-param-last */
import { REHYDRATE } from 'redux-persist';
import type { Action } from '../../actions/transaction';
import { getTxData, getTxMeta } from '../../util/transaction-reducer-helpers';

interface Asset {
  isETH?: boolean;
  tokenId?: unknown;
  [key: string]: unknown;
}

interface TransactionData {
  data?: unknown;
  from?: unknown;
  gas?: unknown;
  gasPrice?: unknown;
  to?: unknown;
  value?: unknown;
  maxFeePerGas?: unknown;
  maxPriorityFeePerGas?: unknown;
  [key: string]: unknown;
}

export interface State {
  ensRecipient: unknown;
  assetType: unknown;
  selectedAsset: Asset | Record<string, never>;
  transaction: TransactionData;
  warningGasPriceHigh: unknown;
  transactionTo: unknown;
  transactionToName: unknown;
  transactionFromName: unknown;
  transactionValue: unknown;
  symbol: unknown;
  paymentRequest: unknown;
  readableValue: unknown;
  id: unknown;
  type: unknown;
  proposedNonce: unknown;
  nonce: unknown;
  securityAlertResponses: Record<string, unknown>;
  useMax: boolean;
  maxValueMode?: unknown;
  [key: string]: unknown;
}

export const initialState: State = {
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

const getAssetType = (selectedAsset?: Asset): string | undefined => {
  let assetType;
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

type ReducerAction = Action | { type: typeof REHYDRATE };

const transactionReducer = (
  state: State = initialState,
  action: ReducerAction,
): State => {
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
      {
        const selectedAsset = action.selectedAsset as Asset;
      return {
        ...state,
        ...initialState,
        selectedAsset,
        assetType: action.assetType,
      };
      }
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
      const selectedAsset = action.selectedAsset as Asset;
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
        transaction: action.transaction as TransactionData,
      };
    case 'SET_TRANSACTION_OBJECT': {
      const transaction = action.transaction as Record<string, unknown>;
      const selectedAsset = transaction.selectedAsset as Asset | undefined;
      if (selectedAsset) {
        const assetType = getAssetType(selectedAsset);
        transaction.assetType = assetType;
      }
      const txMeta = getTxMeta(transaction);
      return {
        ...state,
        transaction: {
          ...state.transaction,
          ...getTxData(transaction),
        },
        ...txMeta,
        // Retain the securityAlertResponses from the old state
        securityAlertResponses: state.securityAlertResponses,
      };
    }
    case 'SET_TOKENS_TRANSACTION': {
      const selectedAsset = action.asset as Asset;
      const assetType = getAssetType(selectedAsset);
      return {
        ...state,
        selectedAsset: action.asset as Asset,
        assetType,
      };
    }
    case 'SET_ETHER_TRANSACTION':
      return {
        ...state,
        symbol: 'ETH',
        assetType: 'ETH',
        selectedAsset: { isETH: true, symbol: 'ETH' },
        ...getTxMeta(action.transaction as Record<string, unknown>),
        transaction: getTxData(action.transaction as Record<string, unknown>),
      };
    case 'SET_TRANSACTION_SECURITY_ALERT_RESPONSE': {
      const { transactionId, securityAlertResponse } = action;
      return {
        ...state,
        securityAlertResponses: {
          ...state.securityAlertResponses,
          [transactionId as string]: securityAlertResponse,
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
