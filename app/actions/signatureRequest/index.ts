import { SecurityAlertResponse } from '../../components/Views/confirmations/legacy/components/BlockaidBanner/BlockaidBanner.types';

export enum ActionType {
  SET_SIGNATURE_REQUEST_SECURITY_ALERT_RESPONSE = 'SET_SIGNATURE_REQUEST_SECURITY_ALERT_RESPONSE',
}

export interface SetSignatureRequestSecurityAlertResponseAction {
  type: ActionType.SET_SIGNATURE_REQUEST_SECURITY_ALERT_RESPONSE;
  securityAlertResponse?: SecurityAlertResponse;
}

export type Action = SetSignatureRequestSecurityAlertResponseAction;

/**
 * Clears transaction object completely
 */
export default function setSignatureRequestSecurityAlertResponse(
  securityAlertResponse?: SecurityAlertResponse,
): SetSignatureRequestSecurityAlertResponseAction {
  return {
    type: ActionType.SET_SIGNATURE_REQUEST_SECURITY_ALERT_RESPONSE,
    securityAlertResponse,
  };
}
