

/**
 * Clears transaction object completely
 */
export default function setSignatureRequestSecurityAlertResponse(
securityAlertResponse)
{
  return {
    type: 'SET_SIGNATURE_REQUEST_SECURITY_ALERT_RESPONSE',
    securityAlertResponse
  };
}