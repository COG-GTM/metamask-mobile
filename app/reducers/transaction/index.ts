import { REHYDRATE } from 'redux-persist';
import { getTxData, getTxMeta } from '../../util/transaction-reducer-helpers';
import {
  TransactionActionTypes,
  TransactionAction,
  SelectedAsset,
  TransactionData,
  AssetType,
  SecurityAlertResponse,
} from '../../actions/transaction';

export interface TransactionState {
  ensRecipient?: string;
  assetType?: AssetType;
  selectedAsset: SelectedAsset;
  transaction: TransactionData;
  warningGasPriceHigh?: string;
  transactionTo?: string;
  transactionToName?: string;
  transactionFromName?: string;
  transactionValue?: string;
  symbol?: string;
  paymentRequest?: unknown;
  readableValue?: string;
  id?: string;
  type?: string;
  proposedNonce?: string;
  nonce?: string;
  securityAlertResponses: Record<string, SecurityAlertResponse>;
  useMax?: boolean;
  maxValueMode?: boolean;
}

export const transactionInitialState: TransactionState = {
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

const getAssetType = (selectedAsset: SelectedAsset): AssetType => {
  if (selectedAsset.isETH) {
    return 'ETH';
  }
  if (selectedAsset.tokenId) {
    return 'ERC721';
  }
  return 'ERC20';
};

interface RehydrateAction {
  type: typeof REHYDRATE;
}

type TransactionReducerAction = TransactionAction | RehydrateAction;

/* eslint-disable @typescript-eslint/default-param-last */
const transactionReducer = (
  state: TransactionState = transactionInitialState,
  action: TransactionReducerAction,
): TransactionState => {
  switch (action.type) {
    case REHYDRATE:
      return {
        ...transactionInitialState,
      };
    case TransactionActionTypes.RESET_TRANSACTION:
      return {
        ...transactionInitialState,
      };
    case TransactionActionTypes.NEW_ASSET_TRANSACTION:
      return {
        ...state,
        ...transactionInitialState,
        selectedAsset: action.selectedAsset,
        assetType: action.assetType,
      };
    case TransactionActionTypes.SET_NONCE:
      return {
        ...state,
        nonce: action.nonce,
      };
    case TransactionActionTypes.SET_PROPOSED_NONCE:
      return {
        ...state,
        proposedNonce: action.proposedNonce,
      };
    case TransactionActionTypes.SET_RECIPIENT:
      return {
        ...state,
        transaction: { ...state.transaction, from: action.from },
        ensRecipient: action.ensRecipient,
        transactionTo: action.to,
        transactionToName: action.transactionToName,
        transactionFromName: action.transactionFromName,
      };
    case TransactionActionTypes.SET_SELECTED_ASSET: {
      const selectedAsset = action.selectedAsset;
      const assetType = action.assetType || getAssetType(selectedAsset);
      return {
        ...state,
        selectedAsset,
        assetType,
      };
    }
    case TransactionActionTypes.PREPARE_TRANSACTION:
      return {
        ...state,
        transaction: action.transaction,
      };
    case TransactionActionTypes.SET_TRANSACTION_OBJECT: {
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
    case TransactionActionTypes.SET_TOKENS_TRANSACTION: {
      const selectedAsset = action.asset;
      const assetType = getAssetType(selectedAsset);
      return {
        ...state,
        selectedAsset: action.asset,
        assetType,
      };
    }
    case TransactionActionTypes.SET_ETHER_TRANSACTION:
      return {
        ...state,
        symbol: 'ETH',
        assetType: 'ETH',
        selectedAsset: { isETH: true, symbol: 'ETH' },
        ...getTxMeta(action.transaction),
        transaction: getTxData(action.transaction),
      };
    case TransactionActionTypes.SET_TRANSACTION_SECURITY_ALERT_RESPONSE: {
      const { transactionId, securityAlertResponse } = action;
      return {
        ...state,
        securityAlertResponses: {
          ...state.securityAlertResponses,
          [transactionId]: securityAlertResponse,
        },
      };
    }
    case TransactionActionTypes.SET_TRANSACTION_ID: {
      const { transactionId } = action;
      return {
        ...state,
        id: transactionId,
      };
    }
    case TransactionActionTypes.SET_MAX_VALUE_MODE: {
      return {
        ...state,
        maxValueMode: action.maxValueMode,
      };
    }
    case TransactionActionTypes.SET_TRANSACTION_VALUE: {
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
