/* eslint-disable @typescript-eslint/default-param-last */
import { REHYDRATE } from 'redux-persist';
import { getTxData, getTxMeta } from '../../util/transaction-reducer-helpers';
import type { SecurityAlertResponse } from '@metamask/transaction-controller';
import type BN from 'bnjs4';
import type {
  TransactionAction,
  SelectedAsset,
  AssetType,
} from '../../actions/transaction';

// Transaction data within state
export interface Transaction {
  data?: string;
  from?: string;
  gas?: BN;
  gasPrice?: BN;
  to?: string;
  value?: BN;
  maxFeePerGas?: BN;
  maxPriorityFeePerGas?: BN;
}

// Security alert responses map
export interface SecurityAlertResponses {
  [transactionId: string]: SecurityAlertResponse;
}

// Transaction reducer state interface
export interface TransactionState {
  ensRecipient?: string;
  assetType?: AssetType;
  selectedAsset: SelectedAsset;
  transaction: Transaction;
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
  securityAlertResponses: SecurityAlertResponses;
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

const getAssetType = (selectedAsset?: SelectedAsset): AssetType | undefined => {
  let assetType: AssetType | undefined;
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

// Action type for REHYDRATE
interface RehydrateAction {
  type: typeof REHYDRATE;
}

// Combined action type for the reducer
type ReducerAction = TransactionAction | RehydrateAction;

const transactionReducer = (
  state: TransactionState = initialState,
  action: ReducerAction,
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
