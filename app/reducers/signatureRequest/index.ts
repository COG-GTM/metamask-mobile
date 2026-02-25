export interface SignatureRequestSecurityAlertResponse {
  block?: number;
  chainId?: string;
  features?: (string | Record<string, string>)[];
  providerRequestsCount?: Record<string, number>;
  reason: string;
  req?: Record<string, unknown>;
  result_type: string;
  source?: string;
  description?: string;
  securityAlertId?: string;
}

export interface SignatureRequestState {
  securityAlertResponse?: SignatureRequestSecurityAlertResponse;
}

interface ActionType {
  type: string;
  securityAlertResponse?: SignatureRequestSecurityAlertResponse;
}

const initialState: SignatureRequestState = {
  securityAlertResponse: undefined,
};

const signatureRequestReducer = (
  state: SignatureRequestState = initialState,
  action: ActionType,
): SignatureRequestState => {
  switch (action.type) {
    case 'SET_SIGNATURE_REQUEST_SECURITY_ALERT_RESPONSE':
      return {
        securityAlertResponse: action.securityAlertResponse,
      };
    default:
      return state;
  }
};
export default signatureRequestReducer;
