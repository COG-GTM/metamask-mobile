import { RootState } from '../../../../reducers';
import { securityAlertResponse } from '../../../../util/test/confirm-data-helpers';
import {
  getSignatureRequestSecurityAlertId,
  selectSignatureSecurityAlertResponse,
} from './security-alerts';

const SECURITY_ALERT_ID_A = 'security-alert-id-a';
const SECURITY_ALERT_ID_B = 'security-alert-id-b';

const benignSecurityAlertResponse = {
  ...securityAlertResponse,
  result_type: 'Benign',
  reason: '',
  description: '',
  features: [],
};

describe('Security Alert Selectors', () => {
  describe('selectSignatureSecurityAlertResponse', () => {
    const state = {
      signatureRequest: {
        securityAlertResponses: {
          [SECURITY_ALERT_ID_A]: securityAlertResponse,
          [SECURITY_ALERT_ID_B]: benignSecurityAlertResponse,
        },
      },
    } as unknown as RootState;

    it('returns the security alert response for the given security alert id', () => {
      expect(
        selectSignatureSecurityAlertResponse(state, SECURITY_ALERT_ID_A),
      ).toEqual(securityAlertResponse);
      expect(
        selectSignatureSecurityAlertResponse(state, SECURITY_ALERT_ID_B),
      ).toEqual(benignSecurityAlertResponse);
    });

    it('returns undefined if no security alert id is provided', () => {
      expect(selectSignatureSecurityAlertResponse(state)).toBeUndefined();
    });

    it('returns undefined if security alert response not present', () => {
      expect(
        selectSignatureSecurityAlertResponse(
          {} as unknown as RootState,
          SECURITY_ALERT_ID_A,
        ),
      ).toEqual(undefined);
    });
  });

  describe('getSignatureRequestSecurityAlertId', () => {
    it('returns the security alert id bound to the signature request', () => {
      expect(
        getSignatureRequestSecurityAlertId({
          securityAlertResponse: { securityAlertId: SECURITY_ALERT_ID_A },
        }),
      ).toBe(SECURITY_ALERT_ID_A);
    });

    it('returns undefined if the signature request has no security alert id', () => {
      expect(getSignatureRequestSecurityAlertId(undefined)).toBeUndefined();
      expect(getSignatureRequestSecurityAlertId({})).toBeUndefined();
    });
  });
});
