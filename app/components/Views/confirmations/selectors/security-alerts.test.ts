import { merge } from 'lodash';
import { RootState } from '../../../../reducers';
import {
  getSignatureSecurityAlertState,
  securityAlertResponse,
  typedSignV1ConfirmationState,
} from '../../../../util/test/confirm-data-helpers';
import {
  selectSecurityAlertResponseBySignatureRequestId,
  selectSignatureSecurityAlertResponseById,
  selectSignatureSecurityAlertResponses,
} from './security-alerts';

const SIGNATURE_REQUEST_ID = '7e62bcb1-a4e9-11ef-9b51-ddf21c91a998';

describe('Security Alert Selectors', () => {
  describe('selectSignatureSecurityAlertResponses', () => {
    it('returns the responses keyed by securityAlertId', () => {
      expect(
        selectSignatureSecurityAlertResponses({
          signatureRequest: {
            securityAlertResponses: { abc: securityAlertResponse },
          },
        } as unknown as RootState),
      ).toEqual({ abc: securityAlertResponse });
    });

    it('returns an empty object for state persisted in the old format', () => {
      expect(
        selectSignatureSecurityAlertResponses({
          signatureRequest: { securityAlertResponse },
        } as unknown as RootState),
      ).toEqual({});
      expect(
        selectSignatureSecurityAlertResponses({} as unknown as RootState),
      ).toEqual({});
    });
  });

  describe('selectSignatureSecurityAlertResponseById', () => {
    it('returns undefined without an id', () => {
      expect(
        selectSignatureSecurityAlertResponseById(
          {
            signatureRequest: {
              securityAlertResponses: { abc: securityAlertResponse },
            },
          } as unknown as RootState,
          undefined,
        ),
      ).toBeUndefined();
    });
  });

  describe('selectSecurityAlertResponseBySignatureRequestId', () => {
    it('returns the response bound to the signature request', () => {
      const state = merge(
        {},
        typedSignV1ConfirmationState,
        getSignatureSecurityAlertState(
          SIGNATURE_REQUEST_ID,
          securityAlertResponse,
        ),
      ) as unknown as RootState;
      expect(
        selectSecurityAlertResponseBySignatureRequestId(
          state,
          SIGNATURE_REQUEST_ID,
        ),
      ).toEqual(securityAlertResponse);
    });

    it('ignores responses that belong to other signature requests', () => {
      const state = merge({}, typedSignV1ConfirmationState, {
        signatureRequest: {
          securityAlertResponses: { 'other-request': securityAlertResponse },
        },
      }) as unknown as RootState;
      expect(
        selectSecurityAlertResponseBySignatureRequestId(
          state,
          SIGNATURE_REQUEST_ID,
        ),
      ).toBeUndefined();
    });
  });
});
