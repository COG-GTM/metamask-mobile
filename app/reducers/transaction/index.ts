import { REHYDRATE } from 'redux-persist';
import { getTxData, getTxMeta } from '../../util/transaction-reducer-helpers';
import {
  type TransactionAction,
  TransactionActionType,
  AssetType,
  type SelectedAsset,
} from '../../actions/transaction/types';
import { type TransactionState } from './types';

export * from './types';

/**
 * Initial transaction state
 */
export const initialTransactionState: TransactionState = {
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

/**
 * Get asset type from selected asset
 */
const getAssetType = (selectedAsset: SelectedAsset): AssetType | undefined => {
  if (selectedAsset) {
    if (selectedAsset.tokenId) {
      return AssetType.ERC721;
    } else if (selectedAsset.isETH) {
      return AssetType.ETH;
    } else {
      return AssetType.ERC20;
    }
  }
  return undefined;
};

/**
 * Transaction reducer
 */
/* eslint-disable @typescript-eslint/default-param-last */
const transactionReducer = (
  state: TransactionState = initialTransactionState,
  action: TransactionAction,
): TransactionState => {
  switch (action.type) {
    case REHYDRATE:
      return {
        ...initialTransactionState,
      };
    case TransactionActionType.RESET_TRANSACTION:
      return {
        ...initialTransactionState,
      };
    case TransactionActionType.NEW_ASSET_TRANSACTION:
      return {
        ...state,
        ...initialTransactionState,
        selectedAsset: action.selectedAsset,
        assetType: action.assetType,
      };
    case TransactionActionType.SET_NONCE:
      return {
        ...state,
        nonce: action.nonce,
      };
    case TransactionActionType.SET_PROPOSED_NONCE:
      return {
        ...state,
        proposedNonce: action.proposedNonce,
      };
    case TransactionActionType.SET_RECIPIENT:
      return {
        ...state,
        transaction: { ...state.transaction, from: action.from },
        ensRecipient: action.ensRecipient,
        transactionTo: action.to,
        transactionToName: action.transactionToName,
        transactionFromName: action.transactionFromName,
      };
    case TransactionActionType.SET_SELECTED_ASSET: {
      const selectedAsset = action.selectedAsset;
      const assetType = action.assetType || getAssetType(selectedAsset);
      return {
        ...state,
        selectedAsset,
        assetType,
      };
    }
    case TransactionActionType.PREPARE_TRANSACTION:
      return {
        ...state,
        transaction: action.transaction,
      };
    case TransactionActionType.SET_TRANSACTION_OBJECT: {
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
        securityAlertResponses: state.securityAlertResponses,
      };
    }
    case TransactionActionType.SET_TOKENS_TRANSACTION: {
      const selectedAsset = action.asset;
      const assetType = getAssetType(selectedAsset);
      return {
        ...state,
        selectedAsset: action.asset,
        assetType,
      };
    }
    case TransactionActionType.SET_ETHER_TRANSACTION:
      return {
        ...state,
        symbol: 'ETH',
        assetType: AssetType.ETH,
        selectedAsset: { isETH: true, symbol: 'ETH' },
        ...getTxMeta(action.transaction),
        transaction: getTxData(action.transaction),
      };
    case TransactionActionType.SET_TRANSACTION_SECURITY_ALERT_RESPONSE: {
      const { transactionId, securityAlertResponse } = action;
      return {
        ...state,
        securityAlertResponses: {
          ...state.securityAlertResponses,
          [transactionId]: securityAlertResponse,
        },
      };
    }
    case TransactionActionType.SET_TRANSACTION_ID: {
      const { transactionId } = action;
      return {
        ...state,
        id: transactionId,
      };
    }
    case TransactionActionType.SET_MAX_VALUE_MODE: {
      return {
        ...state,
        maxValueMode: action.maxValueMode,
      };
    }
    case TransactionActionType.SET_TRANSACTION_VALUE: {
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
