import { renderHook, act } from '@testing-library/react-hooks';

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    request: jest.fn(),
    CancelToken: {
      source: jest.fn(() => ({
        token: 'mock-token',
        cancel: jest.fn(),
      })),
    },
  },
}));

jest.mock('@metamask/swaps-controller', () => ({
  swapsUtils: {
    getTokenMetadataURL: jest.fn(() => 'https://metadata.url'),
  },
}));

import axios from 'axios';
import useFetchTokenMetadata from './useFetchTokenMetadata';

const flush = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

describe('useFetchTokenMetadata', () => {
  beforeEach(() => {
    axios.request.mockReset();
  });

  it('returns the default state when no address is provided', () => {
    const { result } = renderHook(() => useFetchTokenMetadata(null, '0x1'));
    const [isLoading, metadata] = result.current;
    expect(isLoading).toBe(false);
    expect(metadata).toEqual({ valid: null, error: false, metadata: null });
  });

  it('sets valid metadata after a successful fetch', async () => {
    axios.request.mockResolvedValue({
      data: { symbol: 'TKN', decimals: 18 },
    });

    const { result } = renderHook(() =>
      useFetchTokenMetadata('0xabc', '0x1'),
    );

    await flush();

    const [isLoading, metadata] = result.current;
    expect(isLoading).toBe(false);
    expect(metadata.valid).toBe(true);
    expect(metadata.error).toBe(false);
    expect(metadata.metadata).toEqual({ symbol: 'TKN', decimals: 18 });
  });

  it('sets invalid metadata when the server returns a 422', async () => {
    axios.request.mockRejectedValue({ response: { status: 422 } });

    const { result } = renderHook(() =>
      useFetchTokenMetadata('0xabc', '0x1'),
    );

    await flush();

    const [, metadata] = result.current;
    expect(metadata.valid).toBe(false);
    expect(metadata.error).toBe(false);
  });

  it('sets error state for any other failure', async () => {
    axios.request.mockRejectedValue(new Error('network error'));

    const { result } = renderHook(() =>
      useFetchTokenMetadata('0xabc', '0x1'),
    );

    await flush();

    const [, metadata] = result.current;
    expect(metadata.error).toBe(true);
    expect(metadata.valid).toBeNull();
  });
});
