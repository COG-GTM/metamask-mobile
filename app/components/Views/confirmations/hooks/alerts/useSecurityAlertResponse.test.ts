import { merge } from 'lodash';
import { renderHookWithProvider } from '../../../../../util/test/renderWithProvider';
import {
  personalSignatureConfirmationState,
  securityAlertResponse as mockSecurityAlertResponse,
  transferConfirmationState,
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
        personalSignatureConfirmationState,
        mockSecurityAlertResponse,
      ),
    });
    expect(result.current).toStrictEqual({
      securityAlertResponse: mockSecurityAlertResponse,
    });
  });

  it('returns security alert response bound to the displayed signature request', () => {
    const state = merge(
      {},
      withSignatureSecurityAlertResponse(
        personalSignatureConfirmationState,
        mockSecurityAlertResponse,
        'displayed-request-alert-id',
      ),
      {
        signatureRequest: {
          securityAlertResponses: {
            'other-request-alert-id': {
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
    expect(result.current).toStrictEqual({
      securityAlertResponse: mockSecurityAlertResponse,
    });
  });

  it('ignores security alert responses of other signature requests', () => {
    const { result } = renderHookWithProvider(useSecurityAlertResponse, {
      state: merge({}, personalSignatureConfirmationState, {
        signatureRequest: {
          securityAlertResponses: {
            'other-request-alert-id': mockSecurityAlertResponse,
          },
        },
      }),
    });
    expect(result.current).toStrictEqual({
      securityAlertResponse: undefined,
    });
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
