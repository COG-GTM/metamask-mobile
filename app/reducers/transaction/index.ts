/* eslint-disable @typescript-eslint/default-param-last */
import { REHYDRATE } from 'redux-persist';
import type { SecurityAlertResponse } from '../../components/Views/confirmations/legacy/components/BlockaidBanner/BlockaidBanner.types';
import {
  getTxData,
  getTxMeta,
  TxMeta,
} from '../../util/transaction-reducer-helpers';

export interface SelectedAsset {
  isETH?: boolean;
  tokenId?: string;
  symbol?: string;
  [key: string]: unknown;
}

/**
 * Shape of an action's `transaction` payload, which is forwarded to the
 * `getTxData`/`getTxMeta` helpers (hence it extends `TxMeta`).
 */
export interface TransactionPayload extends TxMeta {
  selectedAsset?: SelectedAsset;
  assetType?: string;
}

/**
 * Shape of the `transaction` object stored in state. `value` is widened to also
 * allow a hex string, which is what `SET_TRANSACTION_VALUE` stores.
 */
export interface TransactionObject extends Partial<Omit<TxMeta, 'value'>> {
  value?: TxMeta['value'] | string;
  selectedAsset?: SelectedAsset;
  assetType?: string;
}

export interface TransactionState {
  ensRecipient?: string;
  assetType?: string;
  selectedAsset: SelectedAsset;
  transaction: TransactionObject;
  warningGasPriceHigh?: string;
  transactionTo?: string;
  transactionToName?: string;
  transactionFromName?: string;
  transactionValue?: string;
  symbol?: string;
  paymentRequest?: boolean;
  readableValue?: string;
  id?: string;
  type?: string;
  proposedNonce?: number;
  nonce?: number;
  securityAlertResponses: Record<string, SecurityAlertResponse>;
  useMax: boolean;
  maxValueMode?: boolean;
  // Non-standard transaction properties are spread onto the slice by
  // `getTxMeta` in the SET_TRANSACTION_OBJECT / SET_ETHER_TRANSACTION cases.
  [key: string]: unknown;
}

export const initialState: TransactionState = {
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

interface RehydrateAction {
  type: typeof REHYDRATE;
}

interface ResetTransactionAction {
  type: 'RESET_TRANSACTION';
}

interface NewAssetTransactionAction {
  type: 'NEW_ASSET_TRANSACTION';
  selectedAsset: SelectedAsset;
  assetType?: string;
}

interface SetNonceAction {
  type: 'SET_NONCE';
  nonce?: number;
}

interface SetProposedNonceAction {
  type: 'SET_PROPOSED_NONCE';
  proposedNonce?: number;
}

interface SetRecipientAction {
  type: 'SET_RECIPIENT';
  from?: string;
  to?: string;
  ensRecipient?: string;
  transactionToName?: string;
  transactionFromName?: string;
}

interface SetSelectedAssetAction {
  type: 'SET_SELECTED_ASSET';
  selectedAsset: SelectedAsset;
  assetType?: string;
}

interface PrepareTransactionAction {
  type: 'PREPARE_TRANSACTION';
  transaction: TransactionPayload;
}

interface SetTransactionObjectAction {
  type: 'SET_TRANSACTION_OBJECT';
  transaction: TransactionPayload;
}

interface SetTokensTransactionAction {
  type: 'SET_TOKENS_TRANSACTION';
  asset: SelectedAsset;
}

interface SetEtherTransactionAction {
  type: 'SET_ETHER_TRANSACTION';
  transaction: TransactionPayload;
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
  value?: TxMeta['value'] | string;
}

export type TransactionAction =
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

const getAssetType = (
  selectedAsset?: SelectedAsset,
): string | undefined => {
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
