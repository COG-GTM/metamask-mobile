import { SecurityAlertResponse } from '../../components/Views/confirmations/legacy/components/BlockaidBanner/BlockaidBanner.types';

/**
 * State shape for the signatureRequest reducer
 */
export interface SignatureRequestState {
  securityAlertResponse?: SecurityAlertResponse;
}

interface SetSignatureRequestSecurityAlertResponseAction {
  type: 'SET_SIGNATURE_REQUEST_SECURITY_ALERT_RESPONSE';
  securityAlertResponse?: SecurityAlertResponse;
}

interface DefaultAction {
  type: string;
  securityAlertResponse?: SecurityAlertResponse;
}

type SignatureRequestAction =
  | SetSignatureRequestSecurityAlertResponseAction
  | DefaultAction;

const initialState: SignatureRequestState = {
  securityAlertResponse: undefined,
};

const signatureRequestReducer = (
  state: SignatureRequestState = initialState,
  action: SignatureRequestAction = { type: 'NONE' },
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
