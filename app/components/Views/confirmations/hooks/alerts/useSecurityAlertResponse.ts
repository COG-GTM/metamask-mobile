import { useSelector } from 'react-redux';

import { RootState } from '../../../../../reducers';
import {
  getSignatureRequestSecurityAlertId,
  selectSignatureSecurityAlertResponseById,
} from '../../selectors/security-alerts';
import { useSignatureRequest } from '../signatures/useSignatureRequest';
import { useTransactionMetadataRequest } from '../transactions/useTransactionMetadataRequest';

export function useSecurityAlertResponse() {
  const transactionMetadata = useTransactionMetadataRequest();
  const signatureRequest = useSignatureRequest();
  const securityAlertId = getSignatureRequestSecurityAlertId(signatureRequest);

  const signatureSecurityAlertResponse = useSelector((state: RootState) =>
    selectSignatureSecurityAlertResponseById(state, securityAlertId),
  );

  return {
    securityAlertResponse:
      transactionMetadata?.securityAlertResponse ??
      signatureSecurityAlertResponse,
  };
}
