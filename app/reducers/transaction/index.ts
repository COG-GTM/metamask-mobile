/* eslint-disable @typescript-eslint/default-param-last */
import { REHYDRATE } from 'redux-persist';
import { getTxData, getTxMeta } from '../../util/transaction-reducer-helpers';

interface SelectedAsset {
  tokenId?: string;
  isETH?: boolean;
  symbol?: string;
  address?: string;
  [key: string]: unknown;
}

interface TransactionData {
  data?: string;
  from?: string;
  gas?: unknown;
  gasPrice?: unknown;
  to?: string;
  value?: unknown;
  maxFeePerGas?: unknown;
  maxPriorityFeePerGas?: unknown;
  selectedAsset?: SelectedAsset;
  assetType?: string;
  [key: string]: unknown;
}

// TODO: import from actions when migrated
type TransactionAction =
  | { type: 'RESET_TRANSACTION' }
  | { type: 'NEW_ASSET_TRANSACTION'; selectedAsset: SelectedAsset; assetType: string }
  | { type: 'SET_NONCE'; nonce: string }
  | { type: 'SET_PROPOSED_NONCE'; proposedNonce: string }
  | { type: 'SET_RECIPIENT'; from: string; ensRecipient?: string; to: string; transactionToName?: string; transactionFromName?: string }
  | { type: 'SET_SELECTED_ASSET'; selectedAsset: SelectedAsset; assetType?: string }
  | { type: 'PREPARE_TRANSACTION'; transaction: TransactionData }
  | { type: 'SET_TRANSACTION_OBJECT'; transaction: TransactionData }
  | { type: 'SET_TOKENS_TRANSACTION'; asset: SelectedAsset }
  | { type: 'SET_ETHER_TRANSACTION'; transaction: TransactionData }
  | { type: 'SET_TRANSACTION_SECURITY_ALERT_RESPONSE'; transactionId: string; securityAlertResponse: unknown }
  | { type: 'SET_TRANSACTION_ID'; transactionId: string }
  | { type: 'SET_MAX_VALUE_MODE'; maxValueMode: boolean }
  | { type: 'SET_TRANSACTION_VALUE'; value: unknown };

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
  securityAlertResponses: Record<string, unknown>;
  useMax: boolean;
  maxValueMode?: boolean;
}

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

const getAssetType = (selectedAsset: SelectedAsset): string | undefined => {
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

const transactionReducer = (
  state: TransactionState = initialState,
  action: TransactionAction | { type: string },
): TransactionState => {
  if (action.type === REHYDRATE) {
    return { ...initialState };
  }
  const typedAction = action as TransactionAction;
  switch (typedAction.type) {
    case 'RESET_TRANSACTION':
      return {
        ...initialState,
      };
    case 'NEW_ASSET_TRANSACTION':
      return {
        ...state,
        ...initialState,
        selectedAsset: typedAction.selectedAsset,
        assetType: typedAction.assetType,
      };
    case 'SET_NONCE':
      return {
        ...state,
        nonce: typedAction.nonce,
      };
    case 'SET_PROPOSED_NONCE':
      return {
        ...state,
        proposedNonce: typedAction.proposedNonce,
      };
    case 'SET_RECIPIENT':
      return {
        ...state,
        transaction: { ...state.transaction, from: typedAction.from },
        ensRecipient: typedAction.ensRecipient,
        transactionTo: typedAction.to,
        transactionToName: typedAction.transactionToName,
        transactionFromName: typedAction.transactionFromName,
      };
    case 'SET_SELECTED_ASSET': {
      const selectedAsset = typedAction.selectedAsset;
      const assetType = typedAction.assetType || getAssetType(selectedAsset);
      return {
        ...state,
        selectedAsset,
        assetType,
      };
    }
    case 'PREPARE_TRANSACTION':
      return {
        ...state,
        transaction: typedAction.transaction,
      };
    case 'SET_TRANSACTION_OBJECT': {
      const selectedAsset = typedAction.transaction.selectedAsset;
      if (selectedAsset) {
        const assetType = getAssetType(selectedAsset);
        typedAction.transaction.assetType = assetType;
      }
      const txMeta = getTxMeta(typedAction.transaction);
      return {
        ...state,
        transaction: {
          ...state.transaction,
          ...getTxData(typedAction.transaction),
        },
        ...txMeta,
        // Retain the securityAlertResponses from the old state
        securityAlertResponses: state.securityAlertResponses,
      };
    }
    case 'SET_TOKENS_TRANSACTION': {
      const selectedAsset = typedAction.asset;
      const assetType = getAssetType(selectedAsset);
      return {
        ...state,
        selectedAsset: typedAction.asset,
        assetType,
      };
    }
    case 'SET_ETHER_TRANSACTION':
      return {
        ...state,
        symbol: 'ETH',
        assetType: 'ETH',
        selectedAsset: { isETH: true, symbol: 'ETH' },
        ...getTxMeta(typedAction.transaction),
        transaction: getTxData(typedAction.transaction),
      };
    case 'SET_TRANSACTION_SECURITY_ALERT_RESPONSE': {
      const { transactionId, securityAlertResponse } = typedAction;
      return {
        ...state,
        securityAlertResponses: {
          ...state.securityAlertResponses,
          [transactionId]: securityAlertResponse,
        },
      };
    }
    case 'SET_TRANSACTION_ID': {
      const { transactionId } = typedAction;
      return {
        ...state,
        id: transactionId,
      };
    }
    case 'SET_MAX_VALUE_MODE': {
      return {
        ...state,
        maxValueMode: typedAction.maxValueMode,
      };
    }
    case 'SET_TRANSACTION_VALUE': {
      return {
        ...state,
        transaction: { ...state.transaction, value: typedAction.value },
      };
    }
    default:
      return state;
  }
};
export default transactionReducer;
