import React, { useEffect } from 'react';
import useApprovalRequest from '../../Views/confirmations/hooks/useApprovalRequest';
import { useConfirmationRedesignEnabled } from '../../Views/confirmations/hooks/useConfirmationRedesignEnabled';
import { endTrace, TraceName } from '../../../util/trace';

const SignatureApproval = () => {
  const { approvalRequest } = useApprovalRequest();
  const { isRedesignedEnabled } = useConfirmationRedesignEnabled();
  const signatureRequestId = approvalRequest?.requestData?.requestId;

  useEffect(() => {
    endTrace({
      name: TraceName.NotificationDisplay,
      id: signatureRequestId,
    });
  }, [signatureRequestId]);

  // With confirmation redesign enabled, all signature approvals are handled
  // by the new confirmation system. This component now serves as a compatibility
  // layer and will return null as the new system handles everything.
  if (isRedesignedEnabled) {
    return null;
  }

  // Fallback for cases where redesign is not enabled (should not happen with
  // current feature flag configuration)
  return null;
};

export default SignatureApproval;
