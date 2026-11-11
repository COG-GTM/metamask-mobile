import { RootState } from '../../../../reducers';
import { securityAlertResponse } from '../../../../util/test/confirm-data-helpers';
import { selectSignatureSecurityAlertResponse } from './security-alerts';

const SIGNATURE_REQUEST_ID_MOCK = 'signature-request-id';
const OTHER_SIGNATURE_REQUEST_ID_MOCK = 'other-signature-request-id';

const benignResponse = { ...securityAlertResponse, result_type: 'Benign' };

const createState = () =>
  ({
    engine: {
      backgroundState: {
        SignatureController: {
          signatureRequests: {
            [SIGNATURE_REQUEST_ID_MOCK]: {
              securityAlertResponse: { securityAlertId: 'alert-1' },
            },
            [OTHER_SIGNATURE_REQUEST_ID_MOCK]: {
              securityAlertResponse: { securityAlertId: 'alert-2' },
            },
          },
        },
      },
    },
    signatureRequest: {
      securityAlertResponses: {
        'alert-1': securityAlertResponse,
        'alert-2': benignResponse,
      },
    },
  } as unknown as RootState);

describe('Security Alert Selectors', () => {
  describe('selectSignatureSecurityAlertResponse', () => {
    it('returns the security alert response of the given signature request', () => {
      const state = createState();
      expect(
        selectSignatureSecurityAlertResponse(state, SIGNATURE_REQUEST_ID_MOCK),
      ).toBe(securityAlertResponse);
      expect(
        selectSignatureSecurityAlertResponse(
          state,
          OTHER_SIGNATURE_REQUEST_ID_MOCK,
        ),
      ).toBe(benignResponse);
    });

    it('returns undefined if signature request ID is not provided', () => {
      expect(
        selectSignatureSecurityAlertResponse(createState(), undefined),
      ).toBeUndefined();
    });

    it('returns undefined if signature request has no security alert ID', () => {
      expect(
        selectSignatureSecurityAlertResponse(createState(), 'unknown-id'),
      ).toBeUndefined();
    });
  });
});
