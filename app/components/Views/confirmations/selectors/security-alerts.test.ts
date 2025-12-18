import { RootState } from '../../../../reducers';
import { securityAlertResponse } from '../../../../util/test/confirm-data-helpers';
import { selectSignatureSecurityAlertResponse } from './security-alerts';
import { makeRootState, makeSecurityAlertResponse, Reason, ResultType } from '../../../../util/test/initial-root-state';

describe('Security Alert Selectors', () => {
  describe('selectSignatureSecurityAlertResponse', () => {
    it('returns signature security alert response from the state', () => {
      const typedSecurityAlertResponse = makeSecurityAlertResponse({
        block: securityAlertResponse.block,
        result_type: ResultType.Malicious,
        reason: Reason.permitFarming,
        features: securityAlertResponse.features,
        chainId: securityAlertResponse.chainId,
      });
      const state = makeRootState({
        signatureRequest: {
          securityAlertResponse: typedSecurityAlertResponse,
        },
      });
      expect(
        selectSignatureSecurityAlertResponse(state),
      ).toEqual({ securityAlertResponse: typedSecurityAlertResponse });
    });

    it('returns undefined if security alert response not present', () => {
      expect(
        selectSignatureSecurityAlertResponse({} as unknown as RootState),
      ).toEqual(undefined);
    });
  });
});
