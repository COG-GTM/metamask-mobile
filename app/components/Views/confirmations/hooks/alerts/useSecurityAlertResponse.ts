import { useSelector } from 'react-redux';

import { RootState } from '../../../../../reducers';
import {
  getSignatureRequestSecurityAlertId,
  selectSignatureSecurityAlertResponse,
} from '../../selectors/security-alerts';
import { useSignatureRequest } from '../signatures/useSignatureRequest';
import { useTransactionMetadataRequest } from '../transactions/useTransactionMetadataRequest';

// todo: the hook to be extended to include transactions
export function useSecurityAlertResponse() {
  const transactionMetadata = useTransactionMetadataRequest();
  const signatureRequest = useSignatureRequest();
  const securityAlertId = getSignatureRequestSecurityAlertId(signatureRequest);

  const signatureSecurityAlertResponse = useSelector((state: RootState) =>
    selectSignatureSecurityAlertResponse(state, securityAlertId),
  );

  return {
    securityAlertResponse:
      transactionMetadata?.securityAlertResponse ??
      signatureSecurityAlertResponse,
  };
}
