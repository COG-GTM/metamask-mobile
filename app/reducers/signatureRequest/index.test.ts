import signatureRequestReducer from '.';
import setSignatureRequestSecurityAlertResponse from '../../actions/signatureRequest';
import {
  Reason,
  ResultType,
  SecurityAlertResponse,
} from '../../components/Views/confirmations/legacy/components/BlockaidBanner/BlockaidBanner.types';

const MALICIOUS_RESPONSE: SecurityAlertResponse = {
  result_type: ResultType.Malicious,
  reason: Reason.permitFarming,
};

const BENIGN_RESPONSE: SecurityAlertResponse = {
  result_type: ResultType.Benign,
  reason: Reason.other,
};

describe('signatureRequestReducer', () => {
  it('returns the initial state', () => {
    expect(signatureRequestReducer(undefined, { type: 'NONE' })).toEqual({
      securityAlertResponses: {},
    });
  });

  it('stores responses per security alert ID without overwriting other requests', () => {
    let state = signatureRequestReducer(
      undefined,
      setSignatureRequestSecurityAlertResponse('first', MALICIOUS_RESPONSE),
    );
    state = signatureRequestReducer(
      state,
      setSignatureRequestSecurityAlertResponse('second', BENIGN_RESPONSE),
    );

    expect(state.securityAlertResponses).toEqual({
      first: MALICIOUS_RESPONSE,
      second: BENIGN_RESPONSE,
    });
  });

  it('removes only the response of the given security alert ID', () => {
    let state = signatureRequestReducer(
      undefined,
      setSignatureRequestSecurityAlertResponse('first', MALICIOUS_RESPONSE),
    );
    state = signatureRequestReducer(
      state,
      setSignatureRequestSecurityAlertResponse('second', BENIGN_RESPONSE),
    );
    state = signatureRequestReducer(
      state,
      setSignatureRequestSecurityAlertResponse('second'),
    );

    expect(state.securityAlertResponses).toEqual({
      first: MALICIOUS_RESPONSE,
    });
  });

  it('ignores responses without security alert ID', () => {
    const state = signatureRequestReducer(undefined, {
      type: 'SET_SIGNATURE_REQUEST_SECURITY_ALERT_RESPONSE',
      securityAlertResponse: BENIGN_RESPONSE,
    });

    expect(state.securityAlertResponses).toEqual({});
  });
});
