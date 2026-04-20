import { TOKEN_ADDRESS } from './tokens';

describe('TOKEN_ADDRESS', () => {
  it('exposes the DAI mainnet contract address', () => {
    expect(TOKEN_ADDRESS.DAI).toBe(
      '0x6b175474e89094c44da98b954eedeac495271d0f',
    );
  });
});
