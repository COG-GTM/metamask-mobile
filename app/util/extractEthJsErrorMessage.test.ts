import extractEthjsErrorMessage from './extractEthJsErrorMessage';

describe('extractEthjsErrorMessage', () => {
  it('returns the original message unchanged when it is not an ethjs-rpc error', () => {
    const message = 'Some unrelated error message';
    expect(extractEthjsErrorMessage(message)).toBe(message);
  });

  it('returns an empty string unchanged', () => {
    expect(extractEthjsErrorMessage('')).toBe('');
  });

  it('extracts the trailing error portion of an ethjs-rpc error', () => {
    const message =
      'Error: [ethjs-rpc] rpc error with payload {"id":3947817945380,"jsonrpc":"2.0","params":["0xf8eb"],"method":"eth_sendRawTransaction"} Error: replacement transaction underpriced';
    expect(extractEthjsErrorMessage(message)).toBe(
      'replacement transaction underpriced',
    );
  });

  it('extracts the first inner error when multiple "Error: " labels exist', () => {
    const message =
      'Error: [ethjs-rpc] rpc error with payload {} Error: nested Error: value';
    expect(extractEthjsErrorMessage(message)).toBe('nested Error: value');
  });
});
