import jsonRpcRequest from './jsonRpcRequest';

describe('jsonRpcRequest', () => {
  const mockFetch = jest.fn();
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = mockFetch;
    mockFetch.mockReset();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  const mockResponse = (body: unknown) =>
    mockFetch.mockResolvedValue({ json: () => Promise.resolve(body) });

  it('posts a JSON RPC request and returns the result', async () => {
    mockResponse({ result: '0x1' });
    const result = await jsonRpcRequest('https://rpc.test', 'eth_chainId');

    expect(result).toBe('0x1');
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('https://rpc.test');
    expect(options.method).toBe('POST');
    expect(options.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(JSON.parse(options.body)).toMatchObject({
      jsonrpc: '2.0',
      method: 'eth_chainId',
      params: [],
    });
  });

  it('converts URL credentials into a basic auth header', async () => {
    mockResponse({ result: true });
    await jsonRpcRequest('https://user:pass@rpc.test/path', 'eth_call', ['a']);

    const [url, options] = mockFetch.mock.calls[0];
    expect(url.startsWith('https://rpc.test/path')).toBe(true);
    expect(url).not.toContain('user:pass');
    expect(options.headers.Authorization).toBe(
      `Basic ${Buffer.from('user:pass').toString('base64')}`,
    );
    expect(JSON.parse(options.body).params).toEqual(['a']);
  });

  it.each([[null], [[]], ['string']])(
    'throws for non-object response %p',
    async (body) => {
      mockResponse(body);
      await expect(jsonRpcRequest('https://rpc.test', 'm')).rejects.toThrow(
        'RPC endpoint https://rpc.test returned non-object response.',
      );
    },
  );

  it('throws the error message returned by the endpoint', async () => {
    mockResponse({ error: { message: 'boom' } });
    await expect(jsonRpcRequest('https://rpc.test', 'm')).rejects.toThrow(
      'boom',
    );
  });

  it('throws string errors returned by the endpoint', async () => {
    mockResponse({ error: 'failure' });
    await expect(jsonRpcRequest('https://rpc.test', 'm')).rejects.toThrow(
      'failure',
    );
  });
});
