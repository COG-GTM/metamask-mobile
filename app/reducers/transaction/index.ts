import { REHYDRATE } from 'redux-persist';
import { getTxData, getTxMeta } from '../../util/transaction-reducer-helpers';

// TODO: Replace 'any' with proper type
interface SelectedAsset {
  isETH?: boolean;
  tokenId?: string;
  symbol?: string;
  address?: string;
  [key: string]: unknown;
}

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

interface TransactionState {
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
  paymentRequest: unknown | undefined;
  readableValue: string | undefined;
  id: string | undefined;
  type: string | undefined;
  proposedNonce: string | undefined;
  nonce: string | undefined;
  securityAlertResponses: Record<string, unknown>;
  useMax: boolean;
  maxValueMode?: boolean;
}

// TODO: Replace 'any' with proper type
interface TransactionAction {
  type: string;
  selectedAsset?: SelectedAsset;
  assetType?: string;
  from?: string;
  to?: string;
  ensRecipient?: string;
  transactionToName?: string;
  transactionFromName?: string;
  transaction?: Record<string, unknown>;
  nonce?: string;
  proposedNonce?: string;
  asset?: SelectedAsset;
  transactionId?: string;
  securityAlertResponse?: Record<string, unknown>;
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

const getAssetType = (selectedAsset: SelectedAsset | undefined): string | undefined => {
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

/* eslint-disable @typescript-eslint/default-param-last */
const transactionReducer = (state: TransactionState = initialState, action: TransactionAction): TransactionState => {
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
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        selectedAsset: action.selectedAsset!,
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
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const selectedAsset = action.selectedAsset!;
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
      const selectedAsset = action.transaction?.selectedAsset as SelectedAsset | undefined;
      if (selectedAsset) {
        const assetType = getAssetType(selectedAsset);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        action.transaction!.assetType = assetType;
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
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const selectedAsset = action.asset!;
      const assetType = getAssetType(selectedAsset);
      return {
        ...state,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        selectedAsset: action.asset!,
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
        transaction: getTxData(action.transaction) as TransactionData,
      };
    case 'SET_TRANSACTION_SECURITY_ALERT_RESPONSE': {
      const { transactionId, securityAlertResponse } = action;
      return {
        ...state,
        securityAlertResponses: {
          ...state.securityAlertResponses,
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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
