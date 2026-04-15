
import { securityAlertResponse } from '../../../../util/test/confirm-data-helpers';
import { selectSignatureSecurityAlertResponse } from './security-alerts';

describe('Security Alert Selectors', () => {
  describe('selectSignatureSecurityAlertResponse', () => {
    it('returns signature security alert response from the state', () => {
      expect(
        selectSignatureSecurityAlertResponse({
          signatureRequest: {
            securityAlertResponse
          }
        })
      ).toEqual({ securityAlertResponse });
    });

    it('returns undefined if security alert response not present', () => {
      expect(
        selectSignatureSecurityAlertResponse({})
      ).toEqual(undefined);
    });
  });
});