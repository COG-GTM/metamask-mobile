import { waitFor } from '@testing-library/react-native';
import { act } from '@testing-library/react-hooks';
import useSDKMethod from './useSDKMethod';
import { renderHookWithProvider } from '../../../../util/test/renderWithProvider';

const mockSdkCall = jest.fn();

jest.mock('@consensys/on-ramp-sdk', () => {
  // Use named functions so `.length` reflects the expected number of
  // parameters; useSDKMethod reads the parameter count via
  // SDK.getSignature(..., method) to decide whether every argument is
  // supplied.
  const fakeGetCountries = function () {
    /* no-op */
  };
  const fakeGetDefaultFiatCurrency = function (_a: unknown) {
    /* no-op */
  };
  return {
    RegionsService: {
      prototype: {
        getCountries: fakeGetCountries,
        getDefaultFiatCurrency: fakeGetDefaultFiatCurrency,
      },
    },
    ServicesSignatures: {
      RegionsService: {
        getCountries: { parameters: [] },
        getDefaultFiatCurrency: { parameters: [{ required: true }] },
      },
    },
  };
});

const mockSdk = {
  getCountries: (...args: unknown[]) => mockSdkCall('getCountries', ...args),
  getDefaultFiatCurrency: (...args: unknown[]) =>
    mockSdkCall('getDefaultFiatCurrency', ...args),
};

jest.mock('../sdk', () => ({
  useRampSDK: () => ({ sdk: mockSdk }),
  SDK: {
    getSignature: (_service: unknown, method: { length: number }) => ({
      parameters: new Array(method.length).fill({ required: true }),
    }),
  },
}));

jest.mock('../../../../util/Logger', () => ({
  error: jest.fn(),
}));

describe('useSDKMethod', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('auto-calls the method on mount and sets data when it resolves', async () => {
    mockSdkCall.mockResolvedValueOnce(['a', 'b']);

    const { result } = renderHookWithProvider(() =>
      useSDKMethod('getCountries'),
    );

    await waitFor(() => expect(result.current[0].isFetching).toBe(false));
    expect(result.current[0].data).toEqual(['a', 'b']);
    expect(result.current[0].error).toBeNull();
  });

  it('exposes an error message when the underlying SDK call rejects', async () => {
    mockSdkCall.mockRejectedValueOnce(new Error('bad request'));

    const { result } = renderHookWithProvider(() =>
      useSDKMethod('getCountries'),
    );

    await waitFor(() => expect(result.current[0].isFetching).toBe(false));
    expect(result.current[0].error).toBe('bad request');
    expect(result.current[0].data).toBeNull();
  });

  it('skips the initial call when onMount=false and honors re-invocations with overridden params', async () => {
    mockSdkCall.mockResolvedValue('CL');

    const { result } = renderHookWithProvider(() =>
      useSDKMethod(
        { method: 'getDefaultFiatCurrency', onMount: false },
        '/regions/cl',
      ),
    );

    expect(mockSdkCall).not.toHaveBeenCalled();
    expect(result.current[0].isFetching).toBe(false);

    await act(async () => {
      await result.current[1]('/regions/ar');
    });

    expect(mockSdkCall).toHaveBeenCalledWith(
      'getDefaultFiatCurrency',
      '/regions/ar',
    );
  });

  it('skips the call when required params are missing', async () => {
    const { result } = renderHookWithProvider(() =>
      useSDKMethod(
        { method: 'getDefaultFiatCurrency', onMount: false },
        null,
      ),
    );

    await act(async () => {
      await result.current[1]();
    });

    expect(mockSdkCall).not.toHaveBeenCalled();
  });
});
