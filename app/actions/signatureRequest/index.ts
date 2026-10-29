import { SecurityAlertResponse } from '../../components/Views/confirmations/legacy/components/BlockaidBanner/BlockaidBanner.types';

/**
 * Sets the security alert response for the signature request identified by
 * `securityAlertId`. Passing no response removes the stored entry.
 */
export default function setSignatureRequestSecurityAlertResponse(
  securityAlertId: string,
  securityAlertResponse?: SecurityAlertResponse,
) {
  return {
    type: 'SET_SIGNATURE_REQUEST_SECURITY_ALERT_RESPONSE',
    securityAlertId,
    securityAlertResponse,
  };
}
