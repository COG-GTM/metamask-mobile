import { jsonRpcRequest, JSON_RPC_REQUEST_TIMEOUT_MS } from './jsonRpcRequest';

describe('jsonRpcRequest', () => {
  const originalFetch = global.fetch;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    mockFetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: '0x1' }),
    });
    global.fetch = mockFetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.useRealTimers();
  });

  it('returns the result field of the response', async () => {
    expect(await jsonRpcRequest('https://rpc.example.com', 'eth_chainId')).toBe(
      '0x1',
    );
  });

  it('sends the request without cookies and with an abort signal', async () => {
    await jsonRpcRequest('https://rpc.example.com', 'eth_chainId');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('https://rpc.example.com');
    expect(options).toMatchObject({ method: 'POST', credentials: 'omit' });
    expect(options.signal).toBeInstanceOf(AbortSignal);
    expect(JSON.parse(options.body)).toMatchObject({
      jsonrpc: '2.0',
      method: 'eth_chainId',
      params: [],
    });
  });

  it('moves URL credentials into a Basic Authorization header', async () => {
    await jsonRpcRequest(
      'https://user:pass@rpc.example.com/v1?k=1',
      'eth_chainId',
    );

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('https://rpc.example.com/v1?k=1');
    expect(options.headers.Authorization).toBe(
      `Basic ${Buffer.from('user:pass').toString('base64')}`,
    );
    expect(options.credentials).toBe('omit');
  });

  it('aborts the request after the timeout', async () => {
    jest.useFakeTimers();
    mockFetch.mockImplementation(
      (_url: string, { signal }: { signal: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    );

    const request = jsonRpcRequest('https://slow.example.com', 'eth_chainId');
    jest.advanceTimersByTime(JSON_RPC_REQUEST_TIMEOUT_MS);

    await expect(request).rejects.toThrow('aborted');
  });

  it('throws on RPC errors and non-object responses', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ error: { message: 'boom' } }),
    });
    await expect(
      jsonRpcRequest('https://rpc.example.com', 'eth_chainId'),
    ).rejects.toThrow('boom');

    mockFetch.mockResolvedValueOnce({ json: () => Promise.resolve([1]) });
    await expect(
      jsonRpcRequest('https://rpc.example.com', 'eth_chainId'),
    ).rejects.toThrow('non-object response');
  });
});
