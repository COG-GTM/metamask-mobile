import extractEthjsErrorMessage from './extractEthJsErrorMessage';

describe('extractEthjsErrorMessage', () => {
  it('returns original message for non-ethjs errors', () => {
    expect(extractEthjsErrorMessage('some random error')).toBe('some random error');
  });

  it('extracts error from ethjs-rpc error', () => {
    const fullError = 'Error: [ethjs-rpc] rpc error with payload {"id":1,"jsonrpc":"2.0"} Error: replacement transaction underpriced';
    const result = extractEthjsErrorMessage(fullError);
    expect(result).toBe('replacement transaction underpriced');
  });

  it('handles empty string', () => {
    expect(extractEthjsErrorMessage('')).toBe('');
  });

  it('returns message unchanged when no ethjs slug found', () => {
    const msg = 'Transaction failed: insufficient funds';
    expect(extractEthjsErrorMessage(msg)).toBe(msg);
  });
});
