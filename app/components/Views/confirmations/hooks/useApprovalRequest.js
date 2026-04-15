import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { cloneDeep, isEqual } from 'lodash';

import { providerErrors } from '@metamask/rpc-errors';
import Engine from '../../../../core/Engine';
import { selectPendingApprovals } from '../../../../selectors/approvalController';

// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any


const useApprovalRequest = () => {
  const pendingApprovals = useSelector(selectPendingApprovals, isEqual);
  const pendingApprovalList = Object.values(pendingApprovals ?? {});

  const firstPendingApproval = pendingApprovalList[0];



  const approvalRequest = useMemo(
    () => cloneDeep(firstPendingApproval),
    [firstPendingApproval]
  );

  const onConfirm = useCallback(
    async (
    opts,
    value) =>
    {
      if (!approvalRequest) return;

      await Engine.acceptPendingApproval(
        approvalRequest.id,
        { ...approvalRequest.requestData, ...(value || {}) },
        opts
      );
    },
    [approvalRequest]
  );

  const onReject = useCallback(() => {
    if (!approvalRequest) return;

    Engine.rejectPendingApproval(
      approvalRequest.id,
      providerErrors.userRejectedRequest()
    );
  }, [approvalRequest]);

  const pageMeta = useMemo(
    () => approvalRequest?.requestData?.pageMeta ?? {},
    [approvalRequest]
  );

  return {
    approvalRequest,
    pageMeta,
    onConfirm,
    onReject
  };
};

export default useApprovalRequest;