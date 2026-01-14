import { SecurityAlertResponse } from '../../components/Views/confirmations/legacy/components/BlockaidBanner/BlockaidBanner.types';

export const SET_SIGNATURE_REQUEST_SECURITY_ALERT_RESPONSE =
  'SET_SIGNATURE_REQUEST_SECURITY_ALERT_RESPONSE';

export interface SignatureRequestState {
  securityAlertResponse?: SecurityAlertResponse;
}

interface SetSignatureRequestSecurityAlertResponseAction {
  type: typeof SET_SIGNATURE_REQUEST_SECURITY_ALERT_RESPONSE;
  securityAlertResponse?: SecurityAlertResponse;
}

type SignatureRequestAction = SetSignatureRequestSecurityAlertResponseAction;

const initialState: SignatureRequestState = {
  securityAlertResponse: undefined,
};

const signatureRequestReducer = (
  state: SignatureRequestState = initialState,
  action: SignatureRequestAction,
): SignatureRequestState => {
  switch (action.type) {
    case SET_SIGNATURE_REQUEST_SECURITY_ALERT_RESPONSE:
      return {
        securityAlertResponse: action.securityAlertResponse,
      };
    default:
      return state;
  }
};

export default signatureRequestReducer;
