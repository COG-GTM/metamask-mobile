import { createSelector } from 'reselect';

import { selectSelectedInternalAccountAddress } from '../accountsController';


export const selectBridgeStatusState = (state) =>
state.engine.backgroundState.BridgeStatusController;

/**
 * Returns a mapping of srcTxMetaId to txHistoryItem for the selected address
 */
export const selectBridgeHistoryForAccount = createSelector(
  [selectSelectedInternalAccountAddress, selectBridgeStatusState],
  (selectedAddress, bridgeStatusState) => {
    // Handle the case when bridgeStatusState is undefined
    const { txHistory = {} } = bridgeStatusState || {};

    return Object.keys(txHistory).reduce(
      (acc, txMetaId) => {
        const txHistoryItem = txHistory[txMetaId];
        if (txHistoryItem.account === selectedAddress) {
          acc[txMetaId] = txHistoryItem;
        }
        return acc;
      },
      {}
    );
  }
);