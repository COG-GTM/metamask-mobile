import { createSlice } from '@reduxjs/toolkit';
import type { AnyAction } from 'redux';
import { REHYDRATE } from 'redux-persist';
import {
  ActionType,
  type NewAssetTransactionAction,
  type PrepareTransactionAction,
  type SetEtherTransactionAction,
  type SetMaxValueModeAction,
  type SetNonceAction,
  type SetProposedNonceAction,
  type SetRecipientAction,
  type SetSelectedAssetAction,
  type SetTokensTransactionAction,
  type SetTransactionIdAction,
  type SetTransactionObjectAction,
  type SetTransactionSecurityAlertResponseAction,
  type SetTransactionValueAction,
  type TransactionAsset,
  type TransactionObject,
} from '../../actions/transaction';
import { getTxData, getTxMeta } from '../../util/transaction-reducer-helpers';

export interface TransactionState {
  ensRecipient: string | undefined;
  assetType: string | undefined;
  selectedAsset: TransactionAsset | undefined;
  transaction: TransactionObject;
  warningGasPriceHigh: string | undefined;
  transactionTo: string | undefined;
  transactionToName: string | undefined;
  transactionFromName: string | undefined;
  transactionValue: string | undefined;
  symbol: string | undefined;
  paymentRequest: boolean | undefined;
  readableValue: string | undefined;
  id: string | undefined;
  type: string | undefined;
  proposedNonce: number | undefined;
  nonce: number | undefined;
  securityAlertResponses: Record<string, unknown>;
  useMax: boolean;
  maxValueMode?: boolean;
  /** Transaction metadata (origin, chainId, ...) spread in by SET_TRANSACTION_OBJECT / SET_ETHER_TRANSACTION. */
  [txMetaKey: string]: unknown;
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

const getAssetType = (selectedAsset?: TransactionAsset) => {
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

// Matched by reference rather than with addCase so the reducer behaves exactly
// like the legacy `case REHYDRATE:` wherever redux-persist is mocked (Jest).
const isRehydrateAction = (action: AnyAction) => action.type === REHYDRATE;

// Case reducers return new objects (instead of mutating the Immer draft) to keep
// the legacy reducer's output byte-for-byte, including keys set to `undefined`.
const transactionSlice = createSlice({
  name: 'transaction',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(ActionType.RESET_TRANSACTION, () => ({
        ...initialState,
      }))
      .addCase(
        ActionType.NEW_ASSET_TRANSACTION,
        (state, action: NewAssetTransactionAction) => ({
          ...state,
          ...initialState,
          selectedAsset: action.selectedAsset,
          assetType: action.assetType,
        }),
      )
      .addCase(ActionType.SET_NONCE, (state, action: SetNonceAction) => ({
        ...state,
        nonce: action.nonce,
      }))
      .addCase(
        ActionType.SET_PROPOSED_NONCE,
        (state, action: SetProposedNonceAction) => ({
          ...state,
          proposedNonce: action.proposedNonce,
        }),
      )
      .addCase(
        ActionType.SET_RECIPIENT,
        (state, action: SetRecipientAction) => ({
          ...state,
          transaction: { ...state.transaction, from: action.from },
          ensRecipient: action.ensRecipient,
          transactionTo: action.to,
          transactionToName: action.transactionToName,
          transactionFromName: action.transactionFromName,
        }),
      )
      .addCase(
        ActionType.SET_SELECTED_ASSET,
        (state, action: SetSelectedAssetAction) => {
          const selectedAsset = action.selectedAsset;
          const assetType = action.assetType || getAssetType(selectedAsset);
          return {
            ...state,
            selectedAsset,
            assetType,
          };
        },
      )
      .addCase(
        ActionType.PREPARE_TRANSACTION,
        (state, action: PrepareTransactionAction) => ({
          ...state,
          transaction: action.transaction,
        }),
      )
      .addCase(
        ActionType.SET_TRANSACTION_OBJECT,
        (state, action: SetTransactionObjectAction) => {
          const selectedAsset = action.transaction.selectedAsset;
          if (selectedAsset) {
            const assetType = getAssetType(selectedAsset);
            // Legacy behaviour: the dispatched transaction object is annotated in place.
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
        },
      )
      .addCase(
        ActionType.SET_TOKENS_TRANSACTION,
        (state, action: SetTokensTransactionAction) => {
          const selectedAsset = action.asset;
          const assetType = getAssetType(selectedAsset);
          return {
            ...state,
            selectedAsset: action.asset,
            assetType,
          };
        },
      )
      .addCase(
        ActionType.SET_ETHER_TRANSACTION,
        (state, action: SetEtherTransactionAction) => ({
          ...state,
          symbol: 'ETH',
          assetType: 'ETH',
          selectedAsset: { isETH: true, symbol: 'ETH' },
          ...getTxMeta(action.transaction),
          transaction: getTxData(action.transaction),
        }),
      )
      .addCase(
        ActionType.SET_TRANSACTION_SECURITY_ALERT_RESPONSE,
        (state, action: SetTransactionSecurityAlertResponseAction) => {
          const { transactionId, securityAlertResponse } = action;
          return {
            ...state,
            securityAlertResponses: {
              ...state.securityAlertResponses,
              [transactionId as string]: securityAlertResponse,
            },
          };
        },
      )
      .addCase(
        ActionType.SET_TRANSACTION_ID,
        (state, action: SetTransactionIdAction) => {
          const { transactionId } = action;
          return {
            ...state,
            id: transactionId,
          };
        },
      )
      .addCase(
        ActionType.SET_MAX_VALUE_MODE,
        (state, action: SetMaxValueModeAction) => ({
          ...state,
          maxValueMode: action.maxValueMode,
        }),
      )
      .addCase(
        ActionType.SET_TRANSACTION_VALUE,
        (state, action: SetTransactionValueAction) => ({
          ...state,
          transaction: { ...state.transaction, value: action.value },
        }),
      )
      .addMatcher(isRehydrateAction, () => ({
        ...initialState,
      }));
  },
});

export default transactionSlice.reducer;
