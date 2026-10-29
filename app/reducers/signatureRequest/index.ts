import { SecurityAlertResponse } from '../../components/Views/confirmations/legacy/components/BlockaidBanner/BlockaidBanner.types';

export interface SignatureRequestState {
  securityAlertResponses: Record<string, SecurityAlertResponse>;
}

interface ActionType {
  type: string;
  securityAlertId?: string;
  securityAlertResponse?: SecurityAlertResponse;
}

const initialState: SignatureRequestState = {
  securityAlertResponses: {},
};

const signatureRequestReducer = (
  state: SignatureRequestState = initialState,
  action: ActionType = { type: 'NONE' },
) => {
  switch (action.type) {
    case 'SET_SIGNATURE_REQUEST_SECURITY_ALERT_RESPONSE': {
      const { securityAlertId, securityAlertResponse } = action;

      if (!securityAlertId) {
        return state;
      }

      const securityAlertResponses = {
        ...(state?.securityAlertResponses ?? {}),
      };

      if (securityAlertResponse) {
        securityAlertResponses[securityAlertId] = securityAlertResponse;
      } else {
        delete securityAlertResponses[securityAlertId];
      }

      return { securityAlertResponses };
    }
    default:
      return state;
  }
};
export default signatureRequestReducer;
