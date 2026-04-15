import { createSelector } from 'reselect';




import {

  mergeGasFeeEstimates } from
'@metamask/transaction-controller';


import { createDeepEqualSelector } from './util';
import { selectPendingApprovals } from './approvalController';
import { selectTransactionMetadataById } from './transactionController';

export let GasEstimateTypes = /*#__PURE__*/function (GasEstimateTypes) {GasEstimateTypes["feeMarket"] = "fee-market";GasEstimateTypes["legacy"] = "legacy";GasEstimateTypes["ethGasPrice"] = "eth_gasPrice";GasEstimateTypes["none"] = "none";return GasEstimateTypes;}({});






export let NetworkCongestionThresholds = /*#__PURE__*/function (NetworkCongestionThresholds) {NetworkCongestionThresholds[NetworkCongestionThresholds["notBusy"] = 0] = "notBusy";NetworkCongestionThresholds[NetworkCongestionThresholds["stable"] = 0.33] = "stable";NetworkCongestionThresholds[NetworkCongestionThresholds["busy"] = 0.9] = "busy";return NetworkCongestionThresholds;}({});





function getGasFeeControllerEstimatesByChainId(
state,
chainId)
{
  return state.engine.backgroundState.GasFeeController.
  gasFeeEstimatesByChainId?.[chainId]?.gasFeeEstimates;
}

function getTransactionGasFeeEstimatesByChainId(
state,
chainId)
{
  const pendingApprovals = selectPendingApprovals(state);
  const pendingApprovalList = Object.values(pendingApprovals ?? {});
  const firstPendingApprovalId = pendingApprovalList?.[0]?.id;

  const transactionMetadata = selectTransactionMetadataById(
    state,
    firstPendingApprovalId
  );
  const transactionChainId = transactionMetadata?.chainId;

  if (transactionChainId !== chainId) {
    return undefined;
  }

  return transactionMetadata?.gasFeeEstimates;
}

export const selectGasFeeControllerState = (state) =>
state.engine.backgroundState.GasFeeController;

const selectGasFeeControllerEstimatesStrict = createSelector(
  selectGasFeeControllerState,
  (gasFeeControllerState) => gasFeeControllerState.gasFeeEstimates
);

export const selectGasFeeControllerEstimates = createDeepEqualSelector(
  selectGasFeeControllerEstimatesStrict,
  (gasFeeEstimates) => gasFeeEstimates
);

export const selectGasFeeControllerEstimateType = createSelector(
  selectGasFeeControllerState,
  (gasFeeControllerState) => gasFeeControllerState.gasEstimateType
);

export const selectGasFeeEstimatesByChainId = createSelector(
  getGasFeeControllerEstimatesByChainId,
  getTransactionGasFeeEstimatesByChainId,
  (gasFeeControllerEstimates, transactionGasFeeEstimates) => {
    if (transactionGasFeeEstimates) {
      return mergeGasFeeEstimates({
        gasFeeControllerEstimates,
        transactionGasFeeEstimates
      });
    }

    return gasFeeControllerEstimates;
  }
);