import { waitFor } from '@testing-library/react-native';
import { act } from '@testing-library/react-hooks';
import useRampNetworksDetail from './useRampNetworksDetail';
import { SDK } from '../sdk';
import Logger from '../../../../util/Logger';
import { renderHookWithProvider } from '../../../../util/test/renderWithProvider';

jest.mock('../sdk', () => ({
  SDK: {
    getNetworkDetails: jest.fn(),
  },
}));

jest.mock('../../../../util/Logger', () => ({
  error: jest.fn(),
}));

describe('useRampNetworksDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads network details on mount and exposes them', async () => {
    const mockDetails = [{ chainId: '0x1', nickname: 'Ethereum' }];
    (SDK.getNetworkDetails as jest.Mock).mockResolvedValue(mockDetails);

    const { result } = renderHookWithProvider(() => useRampNetworksDetail());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(SDK.getNetworkDetails).toHaveBeenCalledTimes(1);
    expect(result.current.networksDetails).toEqual(mockDetails);
    expect(result.current.error).toBeUndefined();
    expect(typeof result.current.getNetworksDetail).toBe('function');
  });

  it('records the error and logs it when the SDK call fails', async () => {
    const error = new Error('boom');
    (SDK.getNetworkDetails as jest.Mock).mockRejectedValue(error);

    const { result } = renderHookWithProvider(() => useRampNetworksDetail());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe(error);
    expect(result.current.networksDetails).toEqual([]);
    expect(Logger.error).toHaveBeenCalledWith(
      error,
      'useRampNetworksDetail::getNetworksDetails',
    );
  });

  it('allows re-fetching via the returned getNetworksDetail callback', async () => {
    (SDK.getNetworkDetails as jest.Mock).mockResolvedValue([]);

    const { result } = renderHookWithProvider(() => useRampNetworksDetail());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(SDK.getNetworkDetails).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.getNetworksDetail();
    });

    expect(SDK.getNetworkDetails).toHaveBeenCalledTimes(2);
  });
});
