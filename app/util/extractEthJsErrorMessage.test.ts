import extractEthjsErrorMessage from './extractEthJsErrorMessage';

describe('extractEthjsErrorMessage', () => {
  it('should extract error message from ethjs-rpc error', () => {
    const errorMsg = 'Error: [ethjs-rpc] rpc error with payload {"id":1,"jsonrpc":"2.0"} Error: replacement transaction underpriced';
    const result = extractEthjsErrorMessage(errorMsg);
    expect(result).toBe('replacement transaction underpriced');
  });

  it('should return original message if not ethjs-rpc error', () => {
    const errorMsg = 'Some other error';
    const result = extractEthjsErrorMessage(errorMsg);
    expect(result).toBe('Some other error');
  });

  it('should handle empty string', () => {
    expect(extractEthjsErrorMessage('')).toBe('');
  });
});
