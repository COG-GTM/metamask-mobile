import { act } from '@testing-library/react-native';
import { MetaMetricsEvents } from '../../../../../core/Analytics';
import { updateConfirmationMetric } from '../../../../../core/redux/slices/confirmationMetrics';
import {
  securityAlertResponse,
  typedSignV4ConfirmationState,
  typedSignV4SignatureRequest,
} from '../../../../../util/test/confirm-data-helpers';
import { renderHookWithProvider } from '../../../../../util/test/renderWithProvider';
import {
  resetTrackedSignatureRequests,
  useSignatureMetrics,
} from './useSignatureMetrics';
import { ResultType, Reason, SecurityAlertSource } from '../../../../../components/Views/confirmations/legacy/components/BlockaidBanner/BlockaidBanner.types';

const mockTypedSignV4SignatureRequest = typedSignV4SignatureRequest;
const mockUseSignatureRequest = jest.fn(() => mockTypedSignV4SignatureRequest);
jest.mock('./useSignatureRequest', () => ({
  useSignatureRequest: () => mockUseSignatureRequest(),
}));

jest.mock('../../../../../util/address', () => ({
  getAddressAccountType: (str: string) => str,
}));

const mockTrackEvent = jest.fn().mockImplementation();
jest.mock('../../../../../core/Analytics', () => ({
  ...jest.requireActual('../../../../../core/Analytics'),
  MetaMetrics: {
    getInstance: () => ({ trackEvent: mockTrackEvent }),
  },
}));

const mockAddProperties = jest
  .fn()
  .mockImplementation(() => ({ build: () => ({}) }));
jest.mock('../../../../../core/Analytics/MetricsEventBuilder', () => ({
  ...jest.requireActual('../../../../../core/Analytics/MetricsEventBuilder'),
  MetricsEventBuilder: {
    createEventBuilder: () => ({ addProperties: mockAddProperties }),
  },
}));

const SignatureMetrics = {
  account_type: '0x935e73edb9ff52e23bac7f7e043a1ecd06d05477',
  chain_id: '1',
  dapp_host_name: 'metamask.github.io',
  eip712_primary_type: 'Permit',
  request_source: 'In-App-Browser',
  security_alert_reason: 'permit_farming',
  security_alert_response: 'Malicious',
  security_alert_source: 'api',
  signature_type: 'eth_signTypedData',
  ui_customizations: ['redesigned_confirmation', 'flagged_as_malicious'],
  version: 'V4',
};

const securityAlertResponseLoading = {
  result_type: ResultType.RequestInProgress,
  reason: Reason.notApplicable,
  source: SecurityAlertSource.API,
  providerRequestsCount: {
    eth_call: 5,
    eth_getCode: 3,
  },
  features: [],
};

const SignatureMetricsLoading = {
  account_type: '0x935e73edb9ff52e23bac7f7e043a1ecd06d05477',
  chain_id: '1',
  dapp_host_name: 'metamask.github.io',
  eip712_primary_type: 'Permit',
  request_source: 'In-App-Browser',
  security_alert_reason: 'not_applicable',
  security_alert_response: 'loading',
  security_alert_source: 'api',
  signature_type: 'eth_signTypedData',
  ui_customizations: ['redesigned_confirmation', 'security_alert_loading'],
  version: 'V4',
  ppom_eth_call_count: 5,
  ppom_eth_getCode_count: 3,
};

const securityAlertResponseUndefined = undefined;

const SignatureMetricsUndefined = {
  account_type: '0x935e73edb9ff52e23bac7f7e043a1ecd06d05477',
  chain_id: '1',
  dapp_host_name: 'metamask.github.io',
  eip712_primary_type: 'Permit',
  request_source: 'In-App-Browser',
  signature_type: 'eth_signTypedData',
  ui_customizations: ['redesigned_confirmation'],
  version: 'V4',
};

describe('useSignatureMetrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetTrackedSignatureRequests();
    mockUseSignatureRequest.mockImplementation(
      () => mockTypedSignV4SignatureRequest,
    );
  });

  const requestedEventCount = () => mockTrackEvent.mock.calls.length;

  it('captures SIGNATURE_REQUESTED once when several components use the hook', () => {
    renderHookWithProvider(
      () => {
        useSignatureMetrics();
        useSignatureMetrics();
        useSignatureMetrics();
        useSignatureMetrics();
        useSignatureMetrics();
      },
      {
        state: {
          ...typedSignV4ConfirmationState,
          signatureRequest: { securityAlertResponse },
        },
      },
    );

    expect(requestedEventCount()).toBe(1);
    expect(mockAddProperties).toHaveBeenCalledWith(SignatureMetrics);
  });

  it('does not capture SIGNATURE_REQUESTED again when analytics params change', () => {
    const { store } = renderHookWithProvider(
      () => {
        useSignatureMetrics();
        useSignatureMetrics();
      },
      {
        state: {
          ...typedSignV4ConfirmationState,
          signatureRequest: {
            securityAlertResponse: securityAlertResponseLoading,
          },
        },
      },
    );
    expect(requestedEventCount()).toBe(1);

    act(() => {
      store.dispatch({
        type: 'SET_SIGNATURE_REQUEST_SECURITY_ALERT_RESPONSE',
        securityAlertResponse,
      });
    });
    act(() => {
      store.dispatch(
        updateConfirmationMetric({
          id: mockTypedSignV4SignatureRequest.id,
          params: { properties: { alert_visualized: ['a'] } },
        }),
      );
    });

    expect(requestedEventCount()).toBe(1);
  });

  it('does not capture SIGNATURE_REQUESTED again when the hook remounts for the same request', () => {
    const state = {
      ...typedSignV4ConfirmationState,
      signatureRequest: { securityAlertResponse },
    };
    const { unmount } = renderHookWithProvider(() => useSignatureMetrics(), {
      state,
    });
    unmount();
    renderHookWithProvider(() => useSignatureMetrics(), { state });

    expect(requestedEventCount()).toBe(1);
  });

  it('captures SIGNATURE_REQUESTED for each new signature request id', () => {
    const { rerender } = renderHookWithProvider(() => useSignatureMetrics(), {
      state: {
        ...typedSignV4ConfirmationState,
        signatureRequest: { securityAlertResponse },
      },
    });
    expect(requestedEventCount()).toBe(1);

    mockUseSignatureRequest.mockImplementation(() => ({
      ...mockTypedSignV4SignatureRequest,
      id: 'another-signature-request-id',
    }));
    rerender({});

    expect(requestedEventCount()).toBe(2);
  });

  it('does not capture SIGNATURE_REQUESTED until the request is available', () => {
    mockUseSignatureRequest.mockImplementation(
      () => undefined as unknown as typeof mockTypedSignV4SignatureRequest,
    );
    const { rerender } = renderHookWithProvider(() => useSignatureMetrics(), {
      state: {
        ...typedSignV4ConfirmationState,
        signatureRequest: { securityAlertResponse },
      },
    });
    expect(requestedEventCount()).toBe(0);

    mockUseSignatureRequest.mockImplementation(
      () => mockTypedSignV4SignatureRequest,
    );
    rerender({});

    expect(requestedEventCount()).toBe(1);
  });

  it('should capture metrics events correctly', async () => {
    const { result } = renderHookWithProvider(() => useSignatureMetrics(), {
      state: {
        ...typedSignV4ConfirmationState,
        signatureRequest: { securityAlertResponse },
      },
    });
    // first call for 'SIGNATURE_REQUESTED' event
    expect(mockTrackEvent).toHaveBeenCalledTimes(1);
    expect(mockAddProperties).toHaveBeenCalledWith(SignatureMetrics);
    result?.current?.captureSignatureMetrics(
      MetaMetricsEvents.SIGNATURE_APPROVED,
    );
    expect(mockTrackEvent).toHaveBeenCalledTimes(2);
    expect(mockAddProperties).toHaveBeenLastCalledWith(SignatureMetrics);
    result?.current?.captureSignatureMetrics(
      MetaMetricsEvents.SIGNATURE_REJECTED,
    );
    expect(mockTrackEvent).toHaveBeenCalledTimes(3);
    expect(mockAddProperties).toHaveBeenLastCalledWith(SignatureMetrics);
  });

  it('captures metrics events correctly with loading security alert response', async () => {
    const { result } = renderHookWithProvider(() => useSignatureMetrics(), {
      state: {
        ...typedSignV4ConfirmationState,
        signatureRequest: { securityAlertResponse: securityAlertResponseLoading },
      },
    });

    expect(mockTrackEvent).toHaveBeenCalledTimes(1);
    expect(mockAddProperties).toHaveBeenCalledWith(SignatureMetricsLoading);
    result?.current?.captureSignatureMetrics(
      MetaMetricsEvents.SIGNATURE_APPROVED,
    );
    expect(mockTrackEvent).toHaveBeenCalledTimes(2);
    expect(mockAddProperties).toHaveBeenLastCalledWith(SignatureMetricsLoading);
    result?.current?.captureSignatureMetrics(
      MetaMetricsEvents.SIGNATURE_REJECTED,
    );
    expect(mockTrackEvent).toHaveBeenCalledTimes(3);
    expect(mockAddProperties).toHaveBeenLastCalledWith(SignatureMetricsLoading);
  });

  it('captures metrics events correctly with undefined security alert response', async () => {
    const { result } = renderHookWithProvider(() => useSignatureMetrics(), {
      state: {
        ...typedSignV4ConfirmationState,
        signatureRequest: { securityAlertResponse: securityAlertResponseUndefined },
      },
    });

    expect(mockTrackEvent).toHaveBeenCalledTimes(1);
    expect(mockAddProperties).toHaveBeenCalledWith(SignatureMetricsUndefined);
    result?.current?.captureSignatureMetrics(
      MetaMetricsEvents.SIGNATURE_APPROVED,
    );
    expect(mockTrackEvent).toHaveBeenCalledTimes(2);
    expect(mockAddProperties).toHaveBeenLastCalledWith(SignatureMetricsUndefined);
    result?.current?.captureSignatureMetrics(
      MetaMetricsEvents.SIGNATURE_REJECTED,
    );
    expect(mockTrackEvent).toHaveBeenCalledTimes(3);
    expect(mockAddProperties).toHaveBeenLastCalledWith(SignatureMetricsUndefined);
  });
});
