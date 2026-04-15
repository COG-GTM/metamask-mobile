










const initialState = {
  securityAlertResponse: undefined
};

const signatureRequestReducer = (
state = initialState,
action = { type: 'NONE' }) =>
{
  switch (action.type) {
    case 'SET_SIGNATURE_REQUEST_SECURITY_ALERT_RESPONSE':
      return {
        securityAlertResponse: action.securityAlertResponse
      };
    default:
      return state;
  }
};
export default signatureRequestReducer;