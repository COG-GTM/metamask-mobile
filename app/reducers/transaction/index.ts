import { REHYDRATE } from 'redux-persist';
import { getTxData, getTxMeta } from '../../util/transaction-reducer-helpers';
import { Action } from 'redux';

export interface SelectedAsset {
  tokenId?: string;
  isETH?: boolean;
  symbol?: string;
  address?: string;
  decimals?: number;
  image?: string;
  name?: string;
  [key: string]: unknown;
}

export interface Transaction {
  data?: string;
  from?: string;
  gas?: string;
  gasPrice?: string;
  to?: string;
  value?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  selectedAsset?: SelectedAsset;
  assetType?: string;
  [key: string]: unknown;
}

export interface SecurityAlertResponse {
  [key: string]: unknown;
}

export interface TransactionState {
  ensRecipient: string | undefined;
  assetType: string | undefined;
  selectedAsset: SelectedAsset;
  transaction: Transaction;
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
  securityAlertResponses: Record<string, SecurityAlertResponse>;
  useMax: boolean;
  maxValueMode?: boolean;
}

type AssetType = 'ERC721' | 'ETH' | 'ERC20';

interface RehydrateAction extends Action<typeof REHYDRATE> {}

interface ResetTransactionAction extends Action<'RESET_TRANSACTION'> {}

interface NewAssetTransactionAction extends Action<'NEW_ASSET_TRANSACTION'> {
  selectedAsset: SelectedAsset;
  assetType: AssetType;
}

interface SetNonceAction extends Action<'SET_NONCE'> {
  nonce: string;
}

interface SetProposedNonceAction extends Action<'SET_PROPOSED_NONCE'> {
  proposedNonce: string;
}

interface SetRecipientAction extends Action<'SET_RECIPIENT'> {
  from: string;
  ensRecipient: string;
  to: string;
  transactionToName: string;
  transactionFromName: string;
}

interface SetSelectedAssetAction extends Action<'SET_SELECTED_ASSET'> {
  selectedAsset: SelectedAsset;
  assetType?: AssetType;
}

interface PrepareTransactionAction extends Action<'PREPARE_TRANSACTION'> {
  transaction: Transaction;
}

interface SetTransactionObjectAction extends Action<'SET_TRANSACTION_OBJECT'> {
  transaction: Transaction;
}

interface SetTokensTransactionAction extends Action<'SET_TOKENS_TRANSACTION'> {
  asset: SelectedAsset;
}

interface SetEtherTransactionAction extends Action<'SET_ETHER_TRANSACTION'> {
  transaction: Transaction;
}

interface SetTransactionSecurityAlertResponseAction
  extends Action<'SET_TRANSACTION_SECURITY_ALERT_RESPONSE'> {
  transactionId: string;
  securityAlertResponse: SecurityAlertResponse;
}

interface SetTransactionIdAction extends Action<'SET_TRANSACTION_ID'> {
  transactionId: string;
}

interface SetMaxValueModeAction extends Action<'SET_MAX_VALUE_MODE'> {
  maxValueMode: boolean;
}

interface SetTransactionValueAction extends Action<'SET_TRANSACTION_VALUE'> {
  value: string;
}

type TransactionAction =
  | RehydrateAction
  | ResetTransactionAction
  | NewAssetTransactionAction
  | SetNonceAction
  | SetProposedNonceAction
  | SetRecipientAction
  | SetSelectedAssetAction
  | PrepareTransactionAction
  | SetTransactionObjectAction
  | SetTokensTransactionAction
  | SetEtherTransactionAction
  | SetTransactionSecurityAlertResponseAction
  | SetTransactionIdAction
  | SetMaxValueModeAction
  | SetTransactionValueAction;

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

const getAssetType = (selectedAsset: SelectedAsset): AssetType | undefined => {
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
      const txMeta = getTxMeta(action.transaction as Parameters<typeof getTxMeta>[0]);
      return {
        ...state,
        transaction: {
          ...state.transaction,
          ...getTxData(action.transaction as Parameters<typeof getTxData>[0]),
        },
        ...txMeta,
        // Retain the securityAlertResponses from the old state
        securityAlertResponses: state.securityAlertResponses,
      } as TransactionState;
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
        ...getTxMeta(action.transaction as Parameters<typeof getTxMeta>[0]),
        transaction: getTxData(action.transaction as Parameters<typeof getTxData>[0]) as Transaction,
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
