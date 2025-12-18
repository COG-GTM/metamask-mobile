import { merge } from 'lodash';
import { renderHookWithProvider } from '../../../../../util/test/renderWithProvider';
import {
  securityAlertResponse as mockSecurityAlertResponseData,
  transferConfirmationState,
} from '../../../../../util/test/confirm-data-helpers';
import { useSecurityAlertResponse } from './useSecurityAlertResponse';
import { makeSecurityAlertResponse, Reason, ResultType } from '../../../../../util/test/initial-root-state';

jest.mock('../../../../../core/Engine', () => ({
  context: {
    TokenListController: {
      fetchTokenList: jest.fn(),
    },
  },
}));

// Create a properly typed security alert response from the mock data
const mockSecurityAlertResponse = makeSecurityAlertResponse({
  block: mockSecurityAlertResponseData.block,
  result_type: ResultType.Malicious,
  reason: Reason.permitFarming,
  features: mockSecurityAlertResponseData.features,
  chainId: mockSecurityAlertResponseData.chainId,
});

describe('useSecurityAlertResponse', () => {
  it('returns security alert response for signature request is present', () => {
    const { result } = renderHookWithProvider(useSecurityAlertResponse, {
      state: merge({}, transferConfirmationState, {
        signatureRequest: {
          securityAlertResponse: mockSecurityAlertResponse,
        },
      }),
    });
    expect(result.current).toStrictEqual({
      securityAlertResponse: mockSecurityAlertResponse,
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
