import extractEthjsErrorMessage from './extractEthJsErrorMessage';

describe('extractEthjsErrorMessage', () => {
  it('returns the original message unchanged when it is not an ethjs-rpc error', () => {
    expect(extractEthjsErrorMessage('some unrelated error')).toBe(
      'some unrelated error',
    );
    expect(extractEthjsErrorMessage('')).toBe('');
  });

  it('extracts the trailing original error from an ethjs-rpc error payload', () => {
    const input =
      'Error: [ethjs-rpc] rpc error with payload {"id":1,"jsonrpc":"2.0","method":"eth_sendRawTransaction"} Error: replacement transaction underpriced';
    expect(extractEthjsErrorMessage(input)).toBe(
      'replacement transaction underpriced',
    );
  });
});
