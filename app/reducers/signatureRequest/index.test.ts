import signatureRequestReducer from '.';
import setSignatureRequestSecurityAlertResponse, {
  clearSignatureRequestSecurityAlertResponse,
} from '../../actions/signatureRequest';
import {
  Reason,
  ResultType,
  SecurityAlertResponse,
} from '../../components/Views/confirmations/legacy/components/BlockaidBanner/BlockaidBanner.types';

const MALICIOUS: SecurityAlertResponse = {
  result_type: ResultType.Malicious,
  reason: Reason.permitFarming,
};
const BENIGN: SecurityAlertResponse = {
  result_type: ResultType.Benign,
  reason: Reason.notApplicable,
};

describe('signatureRequestReducer', () => {
  it('stores responses per securityAlertId', () => {
    let state = signatureRequestReducer(
      undefined,
      setSignatureRequestSecurityAlertResponse('a', MALICIOUS),
    );
    state = signatureRequestReducer(
      state,
      setSignatureRequestSecurityAlertResponse('b', BENIGN),
    );
    expect(state.securityAlertResponses).toEqual({ a: MALICIOUS, b: BENIGN });
  });

  it('clears a single response by id', () => {
    const state = signatureRequestReducer(
      { securityAlertResponses: { a: MALICIOUS, b: BENIGN } },
      clearSignatureRequestSecurityAlertResponse('b'),
    );
    expect(state.securityAlertResponses).toEqual({ a: MALICIOUS });
  });

  it('clears all responses without an id', () => {
    const state = signatureRequestReducer(
      { securityAlertResponses: { a: MALICIOUS } },
      clearSignatureRequestSecurityAlertResponse(),
    );
    expect(state.securityAlertResponses).toEqual({});
  });

  it('migrates state persisted in the old single-slot format', () => {
    const state = signatureRequestReducer(
      { securityAlertResponse: MALICIOUS } as never,
      setSignatureRequestSecurityAlertResponse('a', BENIGN),
    );
    expect(state).toEqual({ securityAlertResponses: { a: BENIGN } });
  });
});
