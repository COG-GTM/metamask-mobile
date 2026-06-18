/* eslint-disable @typescript-eslint/default-param-last */
import { REHYDRATE } from 'redux-persist';
import { getTxData, getTxMeta } from '../../util/transaction-reducer-helpers';

export interface TransactionState {
  ensRecipient: string | undefined;
  assetType: string | undefined;
  selectedAsset: Record<string, unknown>;
  transaction: {
    data: string | undefined;
    from: string | undefined;
    gas: unknown;
    gasPrice: unknown;
    to: string | undefined;
    value: unknown;
    maxFeePerGas: unknown;
    maxPriorityFeePerGas: unknown;
    [key: string]: unknown;
  };
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

interface SelectedAsset {
  isETH?: boolean;
  tokenId?: string;
  symbol?: string;
  [key: string]: unknown;
}

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

interface TransactionActionBase {
  type: string;
  selectedAsset?: SelectedAsset;
  assetType?: string;
  from?: string;
  to?: string;
  ensRecipient?: string;
  transactionToName?: string;
  transactionFromName?: string;
  transaction?: Record<string, unknown>;
  transactionId?: string;
  securityAlertResponse?: unknown;
  asset?: SelectedAsset;
  nonce?: string;
  proposedNonce?: string;
  maxValueMode?: boolean;
  value?: string;
}

const transactionReducer = (
  state: TransactionState = initialState,
  action: TransactionActionBase,
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
        selectedAsset: action.selectedAsset as Record<string, unknown>,
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
      const selectedAsset = action.selectedAsset as SelectedAsset;
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
        transaction: action.transaction as TransactionState['transaction'],
      };
    case 'SET_TRANSACTION_OBJECT': {
      const selectedAsset = (
        action.transaction as Record<string, unknown>
      ).selectedAsset as SelectedAsset | undefined;
      if (selectedAsset) {
        const assetType = getAssetType(selectedAsset);
        (action.transaction as Record<string, unknown>).assetType = assetType;
      }
      const txMeta = getTxMeta(
        action.transaction as Parameters<typeof getTxMeta>[0],
      );
      return {
        ...state,
        transaction: {
          ...state.transaction,
          ...getTxData(
            action.transaction as Parameters<typeof getTxData>[0],
          ),
        },
        ...txMeta,
        // Retain the securityAlertResponses from the old state
        securityAlertResponses: state.securityAlertResponses,
      };
    }
    case 'SET_TOKENS_TRANSACTION': {
      const selectedAsset = action.asset as SelectedAsset;
      const assetType = getAssetType(selectedAsset);
      return {
        ...state,
        selectedAsset: action.asset as Record<string, unknown>,
        assetType,
      };
    }
    case 'SET_ETHER_TRANSACTION':
      return {
        ...state,
        symbol: 'ETH',
        assetType: 'ETH',
        selectedAsset: { isETH: true, symbol: 'ETH' },
        ...getTxMeta(
          action.transaction as Parameters<typeof getTxMeta>[0],
        ),
        transaction: getTxData(
          action.transaction as Parameters<typeof getTxData>[0],
        ) as TransactionState['transaction'],
      };
    case 'SET_TRANSACTION_SECURITY_ALERT_RESPONSE': {
      const { transactionId, securityAlertResponse } = action;
      return {
        ...state,
        securityAlertResponses: {
          ...state.securityAlertResponses,
          [transactionId!]: securityAlertResponse,
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
