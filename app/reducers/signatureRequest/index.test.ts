import signatureRequestReducer from '.';

describe('SignatureRequest Reducer', () => {
  const initialState = {
    securityAlertResponse: undefined,
  };

  it('should return initial state', () => {
    expect(signatureRequestReducer(undefined, undefined)).toStrictEqual(initialState);
  });

  it('should handle SET_SIGNATURE_REQUEST_SECURITY_ALERT_RESPONSE', () => {
    const response = { result_type: 'Malicious', reason: 'test' };
    const result = signatureRequestReducer(initialState, {
      type: 'SET_SIGNATURE_REQUEST_SECURITY_ALERT_RESPONSE',
      securityAlertResponse: response as any,
    });

    expect(result.securityAlertResponse).toStrictEqual(response);
  });

  it('should return state for unknown action', () => {
    expect(signatureRequestReducer(initialState, { type: 'UNKNOWN' })).toStrictEqual(initialState);
  });
});
