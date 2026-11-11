import { SecurityAlertResponse } from '../../components/Views/confirmations/legacy/components/BlockaidBanner/BlockaidBanner.types';

/**
 * Sets the security alert response of a single signature request,
 * or removes it when no response is provided.
 *
 * @param securityAlertId - ID generated for the signature request when it was validated.
 * @param securityAlertResponse - Validation result for that request.
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
