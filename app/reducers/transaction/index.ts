import { REHYDRATE } from 'redux-persist';
import { getTxData, getTxMeta } from '../../util/transaction-reducer-helpers';
import type BN from 'bnjs4';

export interface SelectedAsset {
  tokenId?: string;
  isETH?: boolean;
  symbol?: string;
  address?: string;
  decimals?: number;
  name?: string;
  image?: string;
  [key: string]: unknown;
}

export interface TransactionData {
  data?: string;
  from?: string;
  gas?: string | BN;
  gasPrice?: string | BN;
  to?: string;
  value?: string | BN;
  maxFeePerGas?: string | BN;
  maxPriorityFeePerGas?: string | BN;
  securityAlertResponse?: Record<string, unknown>;
}

export interface SecurityAlertResponse {
  result_type?: string;
  reason?: string;
  description?: string;
  features?: string[];
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
  transactionValue?: string;
  symbol?: string;
  paymentRequest?: Record<string, unknown>;
  readableValue?: string;
  id?: string;
  type?: string;
  proposedNonce?: string;
  nonce?: string;
  securityAlertResponses: Record<string, SecurityAlertResponse>;
  useMax: boolean;
  maxValueMode?: boolean;
}

interface TransactionActionBase {
  type: string;
  selectedAsset?: SelectedAsset;
  assetType?: string;
  nonce?: string;
  proposedNonce?: string;
  from?: string;
  ensRecipient?: string;
  to?: string;
  transactionToName?: string;
  transactionFromName?: string;
  transaction?: Record<string, unknown>;
  asset?: SelectedAsset;
  transactionId?: string;
  securityAlertResponse?: SecurityAlertResponse;
  maxValueMode?: boolean;
  value?: string;
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
  action: TransactionActionBase = { type: '' },
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
        selectedAsset: action.selectedAsset || {},
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
      const selectedAsset = action.selectedAsset || {};
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
        transaction: (action.transaction || {}) as TransactionData,
      };
    case 'SET_TRANSACTION_OBJECT': {
      const txObj = action.transaction || {};
      const selectedAsset = txObj.selectedAsset as SelectedAsset | undefined;
      if (selectedAsset) {
        const assetType = getAssetType(selectedAsset);
        txObj.assetType = assetType;
      }
      const txMeta = getTxMeta(txObj);
      return {
        ...state,
        transaction: {
          ...state.transaction,
          ...getTxData(txObj),
        },
        ...txMeta,
        // Retain the securityAlertResponses from the old state
        securityAlertResponses: state.securityAlertResponses,
      };
    }
    case 'SET_TOKENS_TRANSACTION': {
      const selectedAsset = action.asset || {};
      const assetType = getAssetType(selectedAsset);
      return {
        ...state,
        selectedAsset: action.asset || {},
        assetType,
      };
    }
    case 'SET_ETHER_TRANSACTION':
      return {
        ...state,
        symbol: 'ETH',
        assetType: 'ETH',
        selectedAsset: { isETH: true, symbol: 'ETH' },
        ...getTxMeta(action.transaction || {}),
        transaction: getTxData(action.transaction || {}),
      };
    case 'SET_TRANSACTION_SECURITY_ALERT_RESPONSE': {
      const transactionId = action.transactionId as string;
      const securityAlertResponse = action.securityAlertResponse as SecurityAlertResponse;
      return {
        ...state,
        securityAlertResponses: {
          ...state.securityAlertResponses,
          [transactionId]: securityAlertResponse,
        },
      };
    }
    case 'SET_TRANSACTION_ID': {
      const transactionId = action.transactionId as string;
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
