import { REHYDRATE } from 'redux-persist';
import { getTxData, getTxMeta } from '../../util/transaction-reducer-helpers';
import {
  TransactionAction,
  TransactionActionType,
  NewAssetTransactionAction,
  SetNonceAction,
  SetProposedNonceAction,
  SetRecipientAction,
  SetSelectedAssetAction,
  PrepareTransactionAction,
  SetTransactionObjectAction,
  SetTokensTransactionAction,
  SetEtherTransactionAction,
  SetTransactionSecurityAlertResponseAction,
  SetTransactionIdAction,
  SetMaxValueModeAction,
  SetTransactionValueAction,
} from '../../actions/transaction/types';
import { TransactionState } from './types';
import { AnyAction } from 'redux';

export * from './types';

export const initialState: TransactionState = {
  ensRecipient: undefined,
  assetType: undefined,
  selectedAsset: {},
  transaction: {},
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

const getAssetType = (selectedAsset: Record<string, unknown>): string | undefined => {
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

/* eslint-disable @typescript-eslint/default-param-last */
const transactionReducer = (
  state: TransactionState = initialState,
  action: TransactionAction | AnyAction,
): TransactionState => {
  if (action.type === REHYDRATE) {
    return { ...initialState };
  }

  const typedAction = action as TransactionAction;
  switch (typedAction.type) {
    case TransactionActionType.RESET_TRANSACTION:
      return {
        ...initialState,
      };
    case TransactionActionType.NEW_ASSET_TRANSACTION:
      return {
        ...state,
        ...initialState,
        selectedAsset: (typedAction as NewAssetTransactionAction).selectedAsset,
        assetType: (typedAction as NewAssetTransactionAction).assetType,
      };
    case TransactionActionType.SET_NONCE:
      return {
        ...state,
        nonce: (typedAction as SetNonceAction).nonce,
      };
    case TransactionActionType.SET_PROPOSED_NONCE:
      return {
        ...state,
        proposedNonce: (typedAction as SetProposedNonceAction).proposedNonce,
      };
    case TransactionActionType.SET_RECIPIENT: {
      const recipientAction = typedAction as SetRecipientAction;
      return {
        ...state,
        transaction: {
          ...state.transaction,
          from: recipientAction.from,
          to: recipientAction.to,
        },
        ensRecipient: recipientAction.ensRecipient,
        transactionToName: recipientAction.transactionToName,
        transactionFromName: recipientAction.transactionFromName,
      };
    }
    case TransactionActionType.SET_SELECTED_ASSET: {
      const selectedAssetAction = typedAction as SetSelectedAssetAction;
      return {
        ...state,
        selectedAsset: selectedAssetAction.selectedAsset,
        assetType: selectedAssetAction.assetType || getAssetType(selectedAssetAction.selectedAsset),
      };
    }
    case TransactionActionType.PREPARE_TRANSACTION: {
      const prepareAction = typedAction as PrepareTransactionAction;
      const txMeta = getTxMeta(prepareAction.transaction);
      const txData = getTxData(prepareAction.transaction);
      return {
        ...state,
        transaction: {
          ...state.transaction,
          ...txMeta,
          ...txData,
        },
      };
    }
    case TransactionActionType.SET_TRANSACTION_OBJECT: {
      const setTxAction = typedAction as SetTransactionObjectAction;
      const txMeta = getTxMeta(setTxAction.transaction);
      const txData = getTxData(setTxAction.transaction);
      return {
        ...state,
        transaction: {
          ...state.transaction,
          ...txMeta,
          ...txData,
        },
      };
    }
    case TransactionActionType.SET_TOKENS_TRANSACTION: {
      const tokensAction = typedAction as SetTokensTransactionAction;
      return {
        ...state,
        selectedAsset: tokensAction.asset,
        assetType: getAssetType(tokensAction.asset),
      };
    }
    case TransactionActionType.SET_ETHER_TRANSACTION: {
      const etherAction = typedAction as SetEtherTransactionAction;
      const txMeta = getTxMeta(etherAction.transaction);
      const txData = getTxData(etherAction.transaction);
      return {
        ...state,
        transaction: {
          ...state.transaction,
          ...txMeta,
          ...txData,
        },
        selectedAsset: {},
        assetType: undefined,
      };
    }
    case TransactionActionType.SET_TRANSACTION_SECURITY_ALERT_RESPONSE: {
      const securityAction = typedAction as SetTransactionSecurityAlertResponseAction;
      return {
        ...state,
        securityAlertResponses: {
          ...state.securityAlertResponses,
          [securityAction.transactionId]: securityAction.securityAlertResponse,
        },
      };
    }
    case TransactionActionType.SET_TRANSACTION_ID:
      return {
        ...state,
        id: (typedAction as SetTransactionIdAction).transactionId,
      };
    case TransactionActionType.SET_MAX_VALUE_MODE:
      return {
        ...state,
        maxValueMode: (typedAction as SetMaxValueModeAction).maxValueMode,
      };
    case TransactionActionType.SET_TRANSACTION_VALUE:
      return {
        ...state,
        transactionValue: (typedAction as SetTransactionValueAction).value,
      };
    default:
      return state;
  }
};

export default transactionReducer;
