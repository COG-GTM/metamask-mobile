import { jsonRpcRequest } from './jsonRpcRequest';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('jsonRpcRequest', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('makes a POST request with correct body', async () => {
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ result: 'test-result' }),
    });

    const result = await jsonRpcRequest(
      'https://rpc.example.com',
      'eth_blockNumber',
    );

    expect(mockFetch).toHaveBeenCalledWith(
      'https://rpc.example.com',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    expect(result).toBe('test-result');
  });

  it('passes rpcParams in the request body', async () => {
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ result: '0x1' }),
    });

    await jsonRpcRequest('https://rpc.example.com', 'eth_getBalance', [
      '0x1234',
      'latest',
    ]);

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.method).toBe('eth_getBalance');
    expect(callBody.params).toEqual(['0x1234', 'latest']);
    expect(callBody.jsonrpc).toBe('2.0');
  });

  it('throws error when RPC returns an error', async () => {
    mockFetch.mockResolvedValue({
      json: () =>
        Promise.resolve({ error: { message: 'Method not found' } }),
    });

    await expect(
      jsonRpcRequest('https://rpc.example.com', 'invalid_method'),
    ).rejects.toThrow('Method not found');
  });

  it('throws error for non-object response', async () => {
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve([1, 2, 3]),
    });

    await expect(
      jsonRpcRequest('https://rpc.example.com', 'eth_blockNumber'),
    ).rejects.toThrow('returned non-object response');
  });

  it('handles URL with basic auth', async () => {
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ result: 'ok' }),
    });

    await jsonRpcRequest(
      'https://user:pass@rpc.example.com/path',
      'eth_blockNumber',
    );

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).not.toContain('user:pass');
    expect(options.headers.Authorization).toMatch(/^Basic /);
  });

  it('uses default empty array for rpcParams', async () => {
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ result: 'ok' }),
    });

    await jsonRpcRequest('https://rpc.example.com', 'eth_blockNumber');

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.params).toEqual([]);
  });
});
