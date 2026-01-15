import React, { useCallback, useEffect } from 'react';
import useApprovalRequest from '../../../Views/confirmations/hooks/useApprovalRequest';
import { ApprovalTypes } from '../../../../core/RPCMethods/RPCMethodMiddleware';
import SignatureRequestRoot from '../../../Views/confirmations/legacy/components/SignatureRequest/Root';
import { endTrace, TraceName } from '../../../../util/trace';

/**
 * SignatureRequestBase component handles signature request approvals.
 * It listens for unapproved signature messages and renders the appropriate
 * signature request modal (PersonalSign or TypedSign) based on the approval type.
 *
 * This component consolidates signature request handling that was previously
 * spread across RootRPCMethodsUI and other components.
 */
const SignatureRequestBase = () => {
  const { approvalRequest, onReject, onConfirm } = useApprovalRequest();
  const signatureRequestId = approvalRequest?.requestData?.requestId;

  const onSignConfirm = useCallback(async () => {
    await onConfirm({
      waitForResult: true,
      deleteAfterResult: true,
      handleErrors: false,
    });
  }, [onConfirm]);

  useEffect(() => {
    endTrace({
      name: TraceName.NotificationDisplay,
      id: signatureRequestId,
    });
  }, [signatureRequestId]);

  const messageParams =
    approvalRequest &&
    [ApprovalTypes.PERSONAL_SIGN, ApprovalTypes.ETH_SIGN_TYPED_DATA].includes(
      approvalRequest.type as ApprovalTypes,
    )
      ? approvalRequest?.requestData
      : undefined;

  return (
    <SignatureRequestRoot
      messageParams={messageParams}
      approvalType={approvalRequest?.type}
      onSignConfirm={onSignConfirm}
      onSignReject={onReject}
    />
  );
};

export default SignatureRequestBase;
