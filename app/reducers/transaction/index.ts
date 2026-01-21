import { REHYDRATE } from 'redux-persist';
import { getTxData, getTxMeta } from '../../util/transaction-reducer-helpers';
import { Action } from 'redux';
import { SecurityAlertResponse } from '@metamask/transaction-controller';
import type BN from 'bnjs4';

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

export interface TransactionState {
  ensRecipient: string | undefined;
  assetType: 'ETH' | 'ERC20' | 'ERC721' | undefined;
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
  securityAlertResponses: Record<string, SecurityAlertResponse>;
  useMax: boolean;
  maxValueMode?: boolean;
}

type AssetType = 'ETH' | 'ERC20' | 'ERC721';

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
  transaction: TransactionData;
}

interface SetTransactionObjectAction extends Action<'SET_TRANSACTION_OBJECT'> {
  transaction: TransactionData & {
    selectedAsset?: SelectedAsset;
    assetType?: AssetType;
    [key: string]: unknown;
  };
}

interface SetTokensTransactionAction extends Action<'SET_TOKENS_TRANSACTION'> {
  asset: SelectedAsset;
}

interface SetEtherTransactionAction extends Action<'SET_ETHER_TRANSACTION'> {
  transaction: TransactionData & { [key: string]: unknown };
}

interface SetTransactionSecurityAlertResponseAction extends Action<'SET_TRANSACTION_SECURITY_ALERT_RESPONSE'> {
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
  | SetTransactionValueAction
  | Action<string>;

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
    case 'NEW_ASSET_TRANSACTION': {
      const newAssetAction = action as NewAssetTransactionAction;
      return {
        ...state,
        ...initialState,
        selectedAsset: newAssetAction.selectedAsset,
        assetType: newAssetAction.assetType,
      };
    }
    case 'SET_NONCE':
      return {
        ...state,
        nonce: (action as SetNonceAction).nonce,
      };
    case 'SET_PROPOSED_NONCE':
      return {
        ...state,
        proposedNonce: (action as SetProposedNonceAction).proposedNonce,
      };
    case 'SET_RECIPIENT': {
      const recipientAction = action as SetRecipientAction;
      return {
        ...state,
        transaction: { ...state.transaction, from: recipientAction.from },
        ensRecipient: recipientAction.ensRecipient,
        transactionTo: recipientAction.to,
        transactionToName: recipientAction.transactionToName,
        transactionFromName: recipientAction.transactionFromName,
      };
    }
    case 'SET_SELECTED_ASSET': {
      const setAssetAction = action as SetSelectedAssetAction;
      const selectedAsset = setAssetAction.selectedAsset;
      const assetType = setAssetAction.assetType || getAssetType(selectedAsset);
      return {
        ...state,
        selectedAsset,
        assetType,
      };
    }
    case 'PREPARE_TRANSACTION':
      return {
        ...state,
        transaction: (action as PrepareTransactionAction).transaction,
      };
    case 'SET_TRANSACTION_OBJECT': {
      const setTxAction = action as SetTransactionObjectAction;
      const selectedAsset = setTxAction.transaction.selectedAsset;
      const txWithAssetType = { ...setTxAction.transaction };
      if (selectedAsset) {
        const assetType = getAssetType(selectedAsset);
        txWithAssetType.assetType = assetType;
      }
      const txMeta = getTxMeta(txWithAssetType);
      return {
        ...state,
        transaction: {
          ...state.transaction,
          ...getTxData(txWithAssetType),
        },
        ...txMeta,
        securityAlertResponses: state.securityAlertResponses,
      };
    }
    case 'SET_TOKENS_TRANSACTION': {
      const tokensAction = action as SetTokensTransactionAction;
      const selectedAsset = tokensAction.asset;
      const assetType = getAssetType(selectedAsset);
      return {
        ...state,
        selectedAsset: tokensAction.asset,
        assetType,
      };
    }
    case 'SET_ETHER_TRANSACTION': {
      const etherAction = action as SetEtherTransactionAction;
      return {
        ...state,
        symbol: 'ETH',
        assetType: 'ETH',
        selectedAsset: { isETH: true, symbol: 'ETH' },
        ...getTxMeta(etherAction.transaction),
        transaction: getTxData(etherAction.transaction) as TransactionData,
      };
    }
    case 'SET_TRANSACTION_SECURITY_ALERT_RESPONSE': {
      const alertAction = action as SetTransactionSecurityAlertResponseAction;
      const { transactionId, securityAlertResponse } = alertAction;
      return {
        ...state,
        securityAlertResponses: {
          ...state.securityAlertResponses,
          [transactionId]: securityAlertResponse,
        },
      };
    }
    case 'SET_TRANSACTION_ID': {
      const idAction = action as SetTransactionIdAction;
      const { transactionId } = idAction;
      return {
        ...state,
        id: transactionId,
      };
    }
    case 'SET_MAX_VALUE_MODE': {
      return {
        ...state,
        maxValueMode: (action as SetMaxValueModeAction).maxValueMode,
      };
    }
    case 'SET_TRANSACTION_VALUE': {
      return {
        ...state,
        transaction: { ...state.transaction, value: (action as SetTransactionValueAction).value },
      };
    }
    default:
      return state;
  }
};
export default transactionReducer;
