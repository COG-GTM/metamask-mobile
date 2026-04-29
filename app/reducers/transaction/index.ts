/* eslint-disable @typescript-eslint/default-param-last */
import { REHYDRATE } from 'redux-persist';
import { getTxData, getTxMeta } from '../../util/transaction-reducer-helpers';
import {
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
  TransactionAction,
} from '../../actions/transaction';

interface TransactionData {
  data?: string;
  from?: string;
  gas?: string;
  gasPrice?: string;
  to?: string;
  value?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  [key: string]: unknown;
}

interface SelectedAssetData {
  isETH?: boolean;
  tokenId?: string;
  symbol?: string;
  [key: string]: unknown;
}

export interface TransactionState {
  ensRecipient: string | undefined;
  assetType: string | undefined;
  selectedAsset: SelectedAssetData;
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

const getAssetType = (selectedAsset: SelectedAssetData): string | undefined => {
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
  action: TransactionAction | { type: string },
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
    case NEW_ASSET_TRANSACTION: {
      const a = action as TransactionAction & { type: typeof NEW_ASSET_TRANSACTION };
      return {
        ...state,
        ...initialState,
        selectedAsset: a.selectedAsset,
        assetType: a.assetType,
      };
    }
    case SET_NONCE: {
      const a = action as TransactionAction & { type: typeof SET_NONCE };
      return {
        ...state,
        nonce: a.nonce,
      };
    }
    case SET_PROPOSED_NONCE: {
      const a = action as TransactionAction & { type: typeof SET_PROPOSED_NONCE };
      return {
        ...state,
        proposedNonce: a.proposedNonce,
      };
    }
    case SET_RECIPIENT: {
      const a = action as TransactionAction & { type: typeof SET_RECIPIENT };
      return {
        ...state,
        transaction: { ...state.transaction, from: a.from },
        ensRecipient: a.ensRecipient,
        transactionTo: a.to,
        transactionToName: a.transactionToName,
        transactionFromName: a.transactionFromName,
      };
    }
    case SET_SELECTED_ASSET: {
      const a = action as TransactionAction & { type: typeof SET_SELECTED_ASSET };
      const selectedAsset = a.selectedAsset;
      const assetType = a.assetType || getAssetType(selectedAsset);
      return {
        ...state,
        selectedAsset,
        assetType,
      };
    }
    case PREPARE_TRANSACTION: {
      const a = action as TransactionAction & { type: typeof PREPARE_TRANSACTION };
      return {
        ...state,
        transaction: a.transaction,
      };
    }
    case SET_TRANSACTION_OBJECT: {
      const a = action as TransactionAction & { type: typeof SET_TRANSACTION_OBJECT };
      const selectedAsset = (a.transaction as Record<string, unknown>).selectedAsset as SelectedAssetData | undefined;
      if (selectedAsset) {
        const assetType = getAssetType(selectedAsset);
        (a.transaction as Record<string, unknown>).assetType = assetType;
      }
      const txMeta = getTxMeta(a.transaction);
      return {
        ...state,
        transaction: {
          ...state.transaction,
          ...getTxData(a.transaction),
        },
        ...txMeta,
        securityAlertResponses: state.securityAlertResponses,
      };
    }
    case SET_TOKENS_TRANSACTION: {
      const a = action as TransactionAction & { type: typeof SET_TOKENS_TRANSACTION };
      const selectedAsset = a.asset;
      const assetType = getAssetType(selectedAsset);
      return {
        ...state,
        selectedAsset: a.asset,
        assetType,
      };
    }
    case SET_ETHER_TRANSACTION: {
      const a = action as TransactionAction & { type: typeof SET_ETHER_TRANSACTION };
      return {
        ...state,
        symbol: 'ETH',
        assetType: 'ETH',
        selectedAsset: { isETH: true, symbol: 'ETH' },
        ...getTxMeta(a.transaction),
        transaction: getTxData(a.transaction),
      };
    }
    case SET_TRANSACTION_SECURITY_ALERT_RESPONSE: {
      const a = action as TransactionAction & { type: typeof SET_TRANSACTION_SECURITY_ALERT_RESPONSE };
      return {
        ...state,
        securityAlertResponses: {
          ...state.securityAlertResponses,
          [a.transactionId]: a.securityAlertResponse,
        },
      };
    }
    case SET_TRANSACTION_ID: {
      const a = action as TransactionAction & { type: typeof SET_TRANSACTION_ID };
      return {
        ...state,
        id: a.transactionId,
      };
    }
    case SET_MAX_VALUE_MODE: {
      const a = action as TransactionAction & { type: typeof SET_MAX_VALUE_MODE };
      return {
        ...state,
        maxValueMode: a.maxValueMode,
      };
    }
    case SET_TRANSACTION_VALUE: {
      const a = action as TransactionAction & { type: typeof SET_TRANSACTION_VALUE };
      return {
        ...state,
        transaction: { ...state.transaction, value: a.value },
      };
    }
    default:
      return state;
  }
};
export default transactionReducer;
