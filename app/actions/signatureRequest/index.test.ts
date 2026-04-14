import setSignatureRequestSecurityAlertResponse from '.';

describe('SignatureRequest Actions', () => {
  it('should return SET_SIGNATURE_REQUEST_SECURITY_ALERT_RESPONSE with response', () => {
    const securityAlertResponse = {
      result_type: 'Malicious',
      reason: 'test_reason',
    };

    expect(setSignatureRequestSecurityAlertResponse(securityAlertResponse as any)).toStrictEqual({
      type: 'SET_SIGNATURE_REQUEST_SECURITY_ALERT_RESPONSE',
      securityAlertResponse,
    });
  });

  it('should handle undefined securityAlertResponse', () => {
    expect(setSignatureRequestSecurityAlertResponse()).toStrictEqual({
      type: 'SET_SIGNATURE_REQUEST_SECURITY_ALERT_RESPONSE',
      securityAlertResponse: undefined,
    });
  });
});
