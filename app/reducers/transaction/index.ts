import { REHYDRATE } from 'redux-persist';
import { getTxData, getTxMeta } from '../../util/transaction-reducer-helpers';
import type { SecurityAlertResponse } from '@metamask/transaction-controller';
import type BN from 'bnjs4';

/**
 * Represents a selected asset
 */
export interface SelectedAsset {
  tokenId?: string;
  isETH?: boolean;
  symbol?: string;
  address?: string;
  decimals?: number;
  image?: string;
  name?: string;
}

/**
 * Represents the transaction data
 */
export interface TransactionData {
  data?: string;
  from?: string;
  gas?: BN;
  gasPrice?: BN;
  to?: string;
  value?: BN;
  maxFeePerGas?: BN;
  maxPriorityFeePerGas?: BN;
}

/**
 * State shape for the transaction reducer
 */
export interface TransactionState {
  ensRecipient?: string;
  assetType?: 'ETH' | 'ERC20' | 'ERC721';
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

type AssetType = 'ETH' | 'ERC20' | 'ERC721';

/**
 * Action types for transaction reducer
 */
interface RehydrateAction {
  type: typeof REHYDRATE;
}

interface ResetTransactionAction {
  type: 'RESET_TRANSACTION';
}

interface NewAssetTransactionAction {
  type: 'NEW_ASSET_TRANSACTION';
  selectedAsset: SelectedAsset;
  assetType: AssetType;
}

interface SetNonceAction {
  type: 'SET_NONCE';
  nonce: string;
}

interface SetProposedNonceAction {
  type: 'SET_PROPOSED_NONCE';
  proposedNonce: string;
}

interface SetRecipientAction {
  type: 'SET_RECIPIENT';
  from: string;
  ensRecipient?: string;
  to: string;
  transactionToName?: string;
  transactionFromName?: string;
}

interface SetSelectedAssetAction {
  type: 'SET_SELECTED_ASSET';
  selectedAsset: SelectedAsset;
  assetType?: AssetType;
}

interface PrepareTransactionAction {
  type: 'PREPARE_TRANSACTION';
  transaction: TransactionData;
}

interface SetTransactionObjectAction {
  type: 'SET_TRANSACTION_OBJECT';
  transaction: TransactionData & {
    selectedAsset?: SelectedAsset;
    assetType?: AssetType;
  };
}

interface SetTokensTransactionAction {
  type: 'SET_TOKENS_TRANSACTION';
  asset: SelectedAsset;
}

interface SetEtherTransactionAction {
  type: 'SET_ETHER_TRANSACTION';
  transaction: TransactionData;
}

interface SetTransactionSecurityAlertResponseAction {
  type: 'SET_TRANSACTION_SECURITY_ALERT_RESPONSE';
  transactionId: string;
  securityAlertResponse: SecurityAlertResponse;
}

interface SetTransactionIdAction {
  type: 'SET_TRANSACTION_ID';
  transactionId: string;
}

interface SetMaxValueModeAction {
  type: 'SET_MAX_VALUE_MODE';
  maxValueMode: boolean;
}

interface SetTransactionValueAction {
  type: 'SET_TRANSACTION_VALUE';
  value: BN;
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
          ...getTxData(action.transaction),
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
        ...getTxMeta(action.transaction),
        transaction: getTxData(action.transaction),
      } as TransactionState;
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
