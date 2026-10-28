import { SecurityAlertResponse } from '../../components/Views/confirmations/legacy/components/BlockaidBanner/BlockaidBanner.types';

export const SET_SIGNATURE_REQUEST_SECURITY_ALERT_RESPONSE =
  'SET_SIGNATURE_REQUEST_SECURITY_ALERT_RESPONSE';
export const CLEAR_SIGNATURE_REQUEST_SECURITY_ALERT_RESPONSE =
  'CLEAR_SIGNATURE_REQUEST_SECURITY_ALERT_RESPONSE';

/**
 * Stores the security alert response for the signature request identified by `securityAlertId`.
 */
export default function setSignatureRequestSecurityAlertResponse(
  securityAlertId: string,
  securityAlertResponse: SecurityAlertResponse,
) {
  return {
    type: SET_SIGNATURE_REQUEST_SECURITY_ALERT_RESPONSE,
    securityAlertId,
    securityAlertResponse,
  };
}

/**
 * Removes the security alert response for `securityAlertId`, or all of them if no id is given.
 */
export function clearSignatureRequestSecurityAlertResponse(
  securityAlertId?: string,
) {
  return {
    type: CLEAR_SIGNATURE_REQUEST_SECURITY_ALERT_RESPONSE,
    securityAlertId,
  };
}
