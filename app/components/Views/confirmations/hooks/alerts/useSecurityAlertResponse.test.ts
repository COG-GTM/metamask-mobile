import { merge } from 'lodash';
import { renderHookWithProvider } from '../../../../../util/test/renderWithProvider';
import {
  getSignatureSecurityAlertState,
  personalSignatureConfirmationState,
  securityAlertResponse as mockSecurityAlertResponse,
  transferConfirmationState,
} from '../../../../../util/test/confirm-data-helpers';
import { useSecurityAlertResponse } from './useSecurityAlertResponse';

jest.mock('../../../../../core/Engine', () => ({
  context: {
    TokenListController: {
      fetchTokenList: jest.fn(),
    },
  },
}));

describe('useSecurityAlertResponse', () => {
  const PERSONAL_SIGN_ID = '76b33b40-7b5c-11ef-bc0a-25bce29dbc09';

  it('returns security alert response bound to the displayed signature request', () => {
    const { result } = renderHookWithProvider(useSecurityAlertResponse, {
      state: merge(
        {},
        personalSignatureConfirmationState,
        getSignatureSecurityAlertState(
          PERSONAL_SIGN_ID,
          mockSecurityAlertResponse,
        ),
      ),
    });
    expect(result.current).toStrictEqual({
      securityAlertResponse: mockSecurityAlertResponse,
    });
  });

  it('does not return a security alert response produced for another signature request', () => {
    const { result } = renderHookWithProvider(useSecurityAlertResponse, {
      state: merge(
        {},
        personalSignatureConfirmationState,
        getSignatureSecurityAlertState(
          PERSONAL_SIGN_ID,
          mockSecurityAlertResponse,
          'request-a',
        ),
        {
          signatureRequest: {
            securityAlertResponses: {
              'request-b': {
                result_type: 'Benign',
                reason: '',
                securityAlertId: 'request-b',
              },
            },
          },
        },
      ),
    });
    expect(result.current.securityAlertResponse).toStrictEqual(
      mockSecurityAlertResponse,
    );
  });

  it('ignores responses without a matching securityAlertId', () => {
    const { result } = renderHookWithProvider(useSecurityAlertResponse, {
      state: merge({}, personalSignatureConfirmationState, {
        signatureRequest: {
          securityAlertResponses: { 'request-b': mockSecurityAlertResponse },
        },
      }),
    });
    expect(result.current).toStrictEqual({ securityAlertResponse: undefined });
  });

  it('returns security alert response for transaction request is present', () => {
    const { result } = renderHookWithProvider(useSecurityAlertResponse, {
      state: merge({}, transferConfirmationState, {
        engine: {
          backgroundState: {
            TransactionController: {
              transactions: [
                { securityAlertResponse: mockSecurityAlertResponse },
              ],
            },
          },
        },
      }),
    });
    expect(result.current).toStrictEqual({
      securityAlertResponse: mockSecurityAlertResponse,
    });
  });

  it('returns undefined is security alert response is not present for signature request', () => {
    const { result } = renderHookWithProvider(useSecurityAlertResponse, {
      state: transferConfirmationState,
    });
    expect(result.current).toStrictEqual({
      securityAlertResponse: undefined,
    });
  });
});
