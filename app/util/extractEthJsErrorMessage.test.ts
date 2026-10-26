import extractEthjsErrorMessage from './extractEthJsErrorMessage';

describe('extractEthjsErrorMessage', () => {
  it('returns the original error portion of an ethjs-rpc error', () => {
    const message =
      'Error: [ethjs-rpc] rpc error with payload {"id":1,"jsonrpc":"2.0","params":["0x"],"method":"eth_sendRawTransaction"} Error: replacement transaction underpriced';
    expect(extractEthjsErrorMessage(message)).toBe(
      'replacement transaction underpriced',
    );
  });

  it('returns the message unchanged when it is not an ethjs-rpc error', () => {
    expect(extractEthjsErrorMessage('Some other error')).toBe(
      'Some other error',
    );
  });
});
