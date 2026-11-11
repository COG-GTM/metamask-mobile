import { useSelector } from 'react-redux';

import { RootState } from '../../../../../reducers';
import { selectSignatureSecurityAlertResponse } from '../../selectors/security-alerts';
import { useSignatureRequest } from '../signatures/useSignatureRequest';
import useApprovalRequest from '../useApprovalRequest';
import { useTransactionMetadataRequest } from '../transactions/useTransactionMetadataRequest';

export function useSecurityAlertResponse() {
  const transactionMetadata = useTransactionMetadataRequest();
  const { approvalRequest } = useApprovalRequest();
  const signatureRequest = useSignatureRequest();
  const signatureRequestId = signatureRequest ? approvalRequest?.id : undefined;

  const signatureSecurityAlertResponse = useSelector((state: RootState) =>
    selectSignatureSecurityAlertResponse(state, signatureRequestId),
  );

  return {
    securityAlertResponse:
      transactionMetadata?.securityAlertResponse ??
      signatureSecurityAlertResponse,
  };
}
