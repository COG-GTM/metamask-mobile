import { createSelector } from 'reselect';



const selectApprovalControllerState = (state) =>
state?.engine?.backgroundState?.ApprovalController;

export const selectPendingApprovals = createSelector(
  selectApprovalControllerState,
  (approvalControllerState) =>
  approvalControllerState?.pendingApprovals
);

export const selectApprovalFlows = createSelector(
  selectApprovalControllerState,
  (approvalControllerState) =>
  approvalControllerState?.approvalFlows
);