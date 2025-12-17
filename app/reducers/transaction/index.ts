import { REHYDRATE } from 'redux-persist';
import { getTxData, getTxMeta } from '../../util/transaction-reducer-helpers';
import { TransactionState, SelectedAsset } from './types';

interface TransactionAction {
  type: string;
  selectedAsset?: SelectedAsset;
  assetType?: string;
  nonce?: string;
  proposedNonce?: string;
  from?: string;
  to?: string;
  ensRecipient?: string;
  transactionToName?: string;
  transactionFromName?: string;
  transaction?: Record<string, unknown>;
  asset?: SelectedAsset;
  transactionId?: string;
  securityAlertResponse?: unknown;
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

const transactionReducer = (
  state: TransactionState = initialState,
  action: TransactionAction,
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
        selectedAsset: action.selectedAsset ?? {},
        assetType: action.assetType as TransactionState['assetType'],
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
      const selectedAsset = action.selectedAsset ?? {};
      const assetType = (action.assetType || getAssetType(selectedAsset)) as TransactionState['assetType'];
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
      const transaction = action.transaction!;
      const selectedAsset = transaction.selectedAsset as SelectedAsset | undefined;
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
        securityAlertResponses: state.securityAlertResponses,
      } as TransactionState;
    }
    case 'SET_TOKENS_TRANSACTION': {
      const selectedAsset = action.asset ?? {};
      const assetType = getAssetType(selectedAsset) as TransactionState['assetType'];
      return {
        ...state,
        selectedAsset,
        assetType,
      };
    }
    case 'SET_ETHER_TRANSACTION': {
      const transaction = action.transaction!;
      return {
        ...state,
        symbol: 'ETH',
        assetType: 'ETH',
        selectedAsset: { isETH: true, symbol: 'ETH' },
        ...getTxMeta(transaction),
        transaction: getTxData(transaction),
      } as TransactionState;
    }
    case 'SET_TRANSACTION_SECURITY_ALERT_RESPONSE': {
      const transactionId = action.transactionId as string;
      const securityAlertResponse = action.securityAlertResponse as TransactionState['securityAlertResponses'][string];
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
