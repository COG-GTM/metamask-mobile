import { createSelector } from 'reselect';


export const selectBridgeControllerState = (state) =>
state.engine.backgroundState.BridgeController;

export const selectQuoteRequest = createSelector(
  selectBridgeControllerState,
  (bridgeControllerState) => bridgeControllerState.quoteRequest
);