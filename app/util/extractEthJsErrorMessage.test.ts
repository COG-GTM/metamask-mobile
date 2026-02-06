import extractEthjsErrorMessage from './extractEthJsErrorMessage';

describe('extractEthjsErrorMessage', () => {
  it('extracts error message from ethjs-rpc error', () => {
    const errorMessage = `Error: [ethjs-rpc] rpc error with payload {"id":3947817945380,"jsonrpc":"2.0","params":["0xf8eb8208708477359400830398539406012c8cf97bead5deae237070f9587f8e7a266d80b8843d7d3f5a0000000000000000000000000000000000000000000000000000000000081d1a000000000000000000000000000000000000000000000000001ff973cafa800000000000000000000000000000000000000000000000000000038d7ea4c68000000000000000000000000000000000000000000000000000000000000003f48025a04c32a9b630e0d9e7ff361562d850c86b7a884908135956a7e4a336fa0300d19ca06830776423f25218e8d19b267161db526e66895567147015b1f3fc47aef9a3c7"],"method":"eth_sendRawTransaction"} Error: replacement transaction underpriced`;
    expect(extractEthjsErrorMessage(errorMessage)).toBe(
      'replacement transaction underpriced',
    );
  });

  it('extracts error message with different error types', () => {
    const errorMessage = `Error: [ethjs-rpc] rpc error with payload {"id":123,"jsonrpc":"2.0"} Error: nonce too low`;
    expect(extractEthjsErrorMessage(errorMessage)).toBe('nonce too low');
  });

  it('returns original message if not an ethjs-rpc error', () => {
    const errorMessage = 'Some other error message';
    expect(extractEthjsErrorMessage(errorMessage)).toBe(
      'Some other error message',
    );
  });

  it('returns original message for empty string', () => {
    expect(extractEthjsErrorMessage('')).toBe('');
  });

  it('returns original message for regular Error format', () => {
    const errorMessage = 'Error: Something went wrong';
    expect(extractEthjsErrorMessage(errorMessage)).toBe(
      'Error: Something went wrong',
    );
  });

  it('handles error message with multiple Error: prefixes', () => {
    const errorMessage = `Error: [ethjs-rpc] rpc error with payload {} Error: first Error: second`;
    expect(extractEthjsErrorMessage(errorMessage)).toBe('first Error: second');
  });
});
