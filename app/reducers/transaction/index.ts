/* eslint-disable @typescript-eslint/default-param-last */
import { REHYDRATE } from 'redux-persist';
import { getTxData, getTxMeta } from '../../util/transaction-reducer-helpers';
import {
  TransactionAction,
  SelectedAsset,
  RESET_TRANSACTION,
  NEW_ASSET_TRANSACTION,
  SET_NONCE,
  SET_PROPOSED_NONCE,
  SET_RECIPIENT,
  SET_SELECTED_ASSET,
  PREPARE_TRANSACTION,
  SET_TRANSACTION_OBJECT,
  SET_TOKENS_TRANSACTION,
  SET_ETHER_TRANSACTION,
  SET_TRANSACTION_SECURITY_ALERT_RESPONSE,
  SET_TRANSACTION_ID,
  SET_MAX_VALUE_MODE,
  SET_TRANSACTION_VALUE,
} from '../../actions/transaction';
import type { SecurityAlertResponse } from '../../components/Views/confirmations/legacy/components/BlockaidBanner/BlockaidBanner.types';

export interface TransactionData {
  data?: unknown;
  from?: unknown;
  gas?: unknown;
  gasPrice?: unknown;
  to?: unknown;
  value?: unknown;
  // eip1559
  maxFeePerGas?: unknown;
  maxPriorityFeePerGas?: unknown;
  [key: string]: unknown;
}

export interface TransactionState {
  ensRecipient?: string;
  assetType?: string;
  selectedAsset: SelectedAsset;
  transaction: TransactionData;
  warningGasPriceHigh?: string;
  transactionTo?: string;
  transactionToName?: string;
  transactionFromName?: string;
  transactionValue?: unknown;
  symbol?: string;
  paymentRequest?: boolean;
  readableValue?: string;
  id?: string;
  type?: string;
  proposedNonce?: string;
  nonce?: string;
  securityAlertResponses: Record<string, SecurityAlertResponse>;
  useMax: boolean;
  maxValueMode?: boolean;
  [key: string]: unknown;
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

const getAssetType = (selectedAsset?: SelectedAsset) => {
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

interface RehydrateAction {
  type: typeof REHYDRATE;
}

const transactionReducer = (
  state: TransactionState = initialState,
  action: TransactionAction | RehydrateAction,
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
      const selectedAsset = action.transaction.selectedAsset as
        | SelectedAsset
        | undefined;
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
        transaction: getTxData(action.transaction),
      };
    case SET_TRANSACTION_SECURITY_ALERT_RESPONSE: {
      const { transactionId, securityAlertResponse } = action;
      return {
        ...state,
        securityAlertResponses: {
          ...state.securityAlertResponses,
          [transactionId as string]: securityAlertResponse,
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
