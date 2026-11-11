import { merge } from 'lodash';
import { renderHookWithProvider } from '../../../../../util/test/renderWithProvider';
import {
  securityAlertResponse as mockSecurityAlertResponse,
  transferConfirmationState,
  typedSignV4ConfirmationState,
  withSignatureSecurityAlertResponse,
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
  it('returns security alert response for signature request is present', () => {
    const { result } = renderHookWithProvider(useSecurityAlertResponse, {
      state: withSignatureSecurityAlertResponse(
        typedSignV4ConfirmationState,
        mockSecurityAlertResponse,
      ),
    });
    expect(result.current).toStrictEqual({
      securityAlertResponse: mockSecurityAlertResponse,
    });
  });

  it('keeps the malicious result of the pending signature request when another request is validated as benign', () => {
    const state = withSignatureSecurityAlertResponse(
      typedSignV4ConfirmationState,
      mockSecurityAlertResponse,
    );
    state.signatureRequest.securityAlertResponses[
      'other-request-security-alert-id'
    ] = { ...mockSecurityAlertResponse, result_type: 'Benign' };

    const { result } = renderHookWithProvider(useSecurityAlertResponse, {
      state,
    });
    expect(result.current.securityAlertResponse?.result_type).toBe('Malicious');
  });

  it('ignores security alert responses of other signature requests', () => {
    const state = merge(
      {},
      withSignatureSecurityAlertResponse(typedSignV4ConfirmationState),
      {
        signatureRequest: {
          securityAlertResponses: {
            'other-request-security-alert-id': {
              ...mockSecurityAlertResponse,
              result_type: 'Benign',
            },
          },
        },
      },
    );

    const { result } = renderHookWithProvider(useSecurityAlertResponse, {
      state,
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
