import { renderHook } from '@testing-library/react-hooks';
import useTokenDescriptions from './useTokenDescriptions';

describe('useTokenDescriptions', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('returns data after a successful fetch', async () => {
    const descriptions = { en: 'English desc' };
    global.fetch = jest
      .fn()
      .mockResolvedValue({ json: async () => descriptions }) as unknown as typeof global.fetch;

    const { result, waitForNextUpdate } = renderHook(() =>
      useTokenDescriptions({ address: '0xabc', chainId: '0x1' }),
    );

    expect(result.current.isLoading).toBe(true);
    await waitForNextUpdate();

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toEqual(descriptions);
    expect(result.current.error).toBeUndefined();
  });

  it('captures errors from the fetch call', async () => {
    const fetchError = new Error('boom');
    global.fetch = jest
      .fn()
      .mockRejectedValue(fetchError) as unknown as typeof global.fetch;

    const { result, waitForNextUpdate } = renderHook(() =>
      useTokenDescriptions({ address: '0xabc', chainId: '0x1' }),
    );

    await waitForNextUpdate();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(fetchError);
  });
});
