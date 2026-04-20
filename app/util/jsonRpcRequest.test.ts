import jsonRpcRequest from './jsonRpcRequest';

describe('jsonRpcRequest', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('posts the JSON-RPC body and returns the result', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue({ json: async () => ({ jsonrpc: '2.0', id: 1, result: 42 }) });
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await jsonRpcRequest('https://rpc.example.io', 'net_version', [
      'param',
    ]);

    expect(result).toBe(42);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://rpc.example.io');
    expect(init.method).toBe('POST');
    expect(init.headers['Content-Type']).toBe('application/json');
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({
      jsonrpc: '2.0',
      method: 'net_version',
      params: ['param'],
    });
  });

  it('rewrites URLs with basic auth into an Authorization header', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue({ json: async () => ({ result: 'ok' }) });
    global.fetch = fetchMock as unknown as typeof fetch;

    await jsonRpcRequest('https://user:pass@rpc.example.io/path', 'eth_chainId');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).not.toContain('user:pass@');
    expect(url).toContain('rpc.example.io');
    expect(init.headers.Authorization).toMatch(/^Basic /);
  });

  it('throws when the response is not an object', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({ json: async () => [1, 2, 3] }) as unknown as typeof fetch;
    await expect(jsonRpcRequest('https://rpc', 'm')).rejects.toThrow(
      /non-object response/,
    );
  });

  it('throws when the response contains an error', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ error: { message: 'nope' } }),
    }) as unknown as typeof fetch;
    await expect(jsonRpcRequest('https://rpc', 'm')).rejects.toThrow('nope');
  });
});
