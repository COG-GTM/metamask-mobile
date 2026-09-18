import signatureRequestReducer from './index';
import setSignatureRequestSecurityAlertResponse from '../../actions/signatureRequest';
import { SecurityAlertResponse } from '../../components/Views/confirmations/legacy/components/BlockaidBanner/BlockaidBanner.types';

describe('signatureRequestReducer', () => {
  it('returns the initial state', () => {
    expect(signatureRequestReducer(undefined)).toEqual({
      securityAlertResponse: undefined,
    });
  });

  it('sets the security alert response', () => {
    const securityAlertResponse = {
      result_type: 'Benign',
      reason: 'none',
    } as unknown as SecurityAlertResponse;
    const state = signatureRequestReducer(
      undefined,
      setSignatureRequestSecurityAlertResponse(securityAlertResponse),
    );
    expect(state).toEqual({ securityAlertResponse });
  });

  it('returns the same state for unknown actions', () => {
    const state = { securityAlertResponse: undefined };
    expect(signatureRequestReducer(state, { type: 'UNKNOWN' })).toBe(state);
  });

  it('creates the action', () => {
    expect(setSignatureRequestSecurityAlertResponse()).toEqual({
      type: 'SET_SIGNATURE_REQUEST_SECURITY_ALERT_RESPONSE',
      securityAlertResponse: undefined,
    });
  });
});
