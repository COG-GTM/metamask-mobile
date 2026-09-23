import { renderHook, act } from '@testing-library/react-hooks';
import axios from 'axios';
import useFetchTokenMetadata from './useFetchTokenMetadata';
import Logger from '../../../../util/Logger';

jest.mock('axios');
jest.mock('../../../../util/Logger', () => ({
  error: jest.fn(),
}));
jest.mock('@metamask/swaps-controller', () => ({
  swapsUtils: {
    getTokenMetadataURL: jest.fn(() => 'https://metadata.test/token'),
  },
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;
const ADDRESS = '0x0000000000000000000000000000000000000001';
const CHAIN_ID = '0x1';

describe('useFetchTokenMetadata', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockedAxios.CancelToken.source as jest.Mock).mockReturnValue({
      token: 'token',
      cancel: jest.fn(),
    });
    mockedAxios.isCancel.mockReturnValue(false);
  });

  it('returns metadata on success', async () => {
    mockedAxios.request.mockResolvedValue({ data: { symbol: 'FOO' } });

    const { result, waitForNextUpdate } = renderHook(() =>
      useFetchTokenMetadata(ADDRESS, CHAIN_ID),
    );
    await waitForNextUpdate();

    expect(result.current[1]).toEqual({
      error: false,
      valid: true,
      metadata: { symbol: 'FOO' },
    });
    expect(Logger.error).not.toHaveBeenCalled();
  });

  it('treats a 422 response as a non-ERC20 address without logging', async () => {
    mockedAxios.request.mockRejectedValue({ response: { status: 422 } });

    const { result, waitForNextUpdate } = renderHook(() =>
      useFetchTokenMetadata(ADDRESS, CHAIN_ID),
    );
    await waitForNextUpdate();

    expect(result.current[1]).toEqual({
      error: false,
      valid: false,
      metadata: null,
    });
    expect(Logger.error).not.toHaveBeenCalled();
  });

  it('logs the error when the metadata service fails', async () => {
    const error = { response: { status: 500 } };
    mockedAxios.request.mockRejectedValue(error);

    const { result, waitForNextUpdate } = renderHook(() =>
      useFetchTokenMetadata(ADDRESS, CHAIN_ID),
    );
    await waitForNextUpdate();

    expect(result.current[1]).toEqual({
      valid: null,
      error: true,
      metadata: null,
    });
    expect(Logger.error).toHaveBeenCalledWith(error, {
      message: 'Swaps: error while fetching token metadata',
      chain_id: CHAIN_ID,
      status: 500,
    });
  });

  it('does not log cancelled requests', async () => {
    const error = new Error('cancelled');
    mockedAxios.request.mockRejectedValue(error);
    mockedAxios.isCancel.mockReturnValue(true);

    const { waitForNextUpdate } = renderHook(() =>
      useFetchTokenMetadata(ADDRESS, CHAIN_ID),
    );
    await act(async () => {
      await waitForNextUpdate();
    });

    expect(Logger.error).not.toHaveBeenCalled();
  });
});
