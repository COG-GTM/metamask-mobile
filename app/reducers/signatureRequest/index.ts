import { SecurityAlertResponse } from '../../components/Views/confirmations/legacy/components/BlockaidBanner/BlockaidBanner.types';
import {
  CLEAR_SIGNATURE_REQUEST_SECURITY_ALERT_RESPONSE,
  SET_SIGNATURE_REQUEST_SECURITY_ALERT_RESPONSE,
} from '../../actions/signatureRequest';

export interface SignatureRequestState {
  /** Security alert responses keyed by the securityAlertId of the signature request they belong to. */
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
): SignatureRequestState => {
  // Persisted state from older versions stored a single global response.
  const securityAlertResponses = state.securityAlertResponses ?? {};

  switch (action.type) {
    case SET_SIGNATURE_REQUEST_SECURITY_ALERT_RESPONSE: {
      const { securityAlertId, securityAlertResponse } = action;
      if (!securityAlertId || !securityAlertResponse) {
        return state;
      }
      return {
        securityAlertResponses: {
          ...securityAlertResponses,
          [securityAlertId]: securityAlertResponse,
        },
      };
    }
    case CLEAR_SIGNATURE_REQUEST_SECURITY_ALERT_RESPONSE: {
      const { securityAlertId } = action;
      if (!securityAlertId) {
        return initialState;
      }
      if (!(securityAlertId in securityAlertResponses)) {
        return state;
      }
      const { [securityAlertId]: _removed, ...remaining } =
        securityAlertResponses;
      return { securityAlertResponses: remaining };
    }
    default:
      return state;
  }
};
export default signatureRequestReducer;
