import { jsonRpcRequest } from './jsonRpcRequest';

describe('jsonRpcRequest', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should make a POST request with correct body', async () => {
    const mockResponse = { result: '0x1', error: null };
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve(mockResponse),
    });

    const result = await jsonRpcRequest('https://rpc.example.com', 'eth_blockNumber');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://rpc.example.com',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    expect(result).toBe('0x1');
  });

  it('should throw on error response', async () => {
    const mockResponse = { error: { message: 'rate limit exceeded' } };
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve(mockResponse),
    });

    await expect(
      jsonRpcRequest('https://rpc.example.com', 'eth_blockNumber'),
    ).rejects.toThrow('rate limit exceeded');
  });

  it('should throw on non-object response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve([1, 2, 3]),
    });

    await expect(
      jsonRpcRequest('https://rpc.example.com', 'eth_blockNumber'),
    ).rejects.toThrow('non-object response');
  });
});
