import setSignatureRequestSecurityAlertResponse from '../../actions/signatureRequest';
import { SecurityAlertResponse } from '../../components/Views/confirmations/legacy/components/BlockaidBanner/BlockaidBanner.types';
import signatureRequestReducer from '.';

const maliciousResponse = {
  result_type: 'Malicious',
  reason: 'permit_farming',
} as unknown as SecurityAlertResponse;

const benignResponse = {
  result_type: 'Benign',
  reason: '',
} as unknown as SecurityAlertResponse;

describe('signatureRequestReducer', () => {
  it('stores security alert responses per security alert id', () => {
    let state = signatureRequestReducer(
      undefined,
      setSignatureRequestSecurityAlertResponse('a', maliciousResponse),
    );
    state = signatureRequestReducer(
      state,
      setSignatureRequestSecurityAlertResponse('b', benignResponse),
    );

    expect(state.securityAlertResponses).toStrictEqual({
      a: maliciousResponse,
      b: benignResponse,
    });
  });

  it('only removes the response for the given security alert id', () => {
    let state = signatureRequestReducer(
      {
        securityAlertResponses: { a: maliciousResponse, b: benignResponse },
      },
      setSignatureRequestSecurityAlertResponse('b'),
    );

    expect(state.securityAlertResponses).toStrictEqual({
      a: maliciousResponse,
    });

    state = signatureRequestReducer(
      state,
      setSignatureRequestSecurityAlertResponse('a'),
    );
    expect(state.securityAlertResponses).toStrictEqual({});
  });

  it('ignores updates without a security alert id', () => {
    const state = {
      securityAlertResponses: { a: maliciousResponse },
    };

    expect(
      signatureRequestReducer(state, {
        type: 'SET_SIGNATURE_REQUEST_SECURITY_ALERT_RESPONSE',
        securityAlertResponse: benignResponse,
      }),
    ).toBe(state);
  });
});
