import { SolScope } from '@metamask/keyring-api';
import { DefaultSwapDestTokens } from './default-swap-dest-tokens';

describe('DefaultSwapDestTokens', () => {
  it('contains an entry for the Solana mainnet scope', () => {
    expect(DefaultSwapDestTokens[SolScope.Mainnet]).toBeDefined();
  });

  it('maps Solana mainnet to the USDC token with correct metadata', () => {
    const token = DefaultSwapDestTokens[SolScope.Mainnet];
    expect(token).toMatchObject({
      symbol: 'USDC',
      decimals: 6,
      chainId: SolScope.Mainnet,
    });
    expect(token.address).toContain('solana:');
    expect(token.address).toContain('token:');
    expect(typeof token.image).toBe('string');
    expect(token.image).toMatch(/^https?:\/\//);
  });
});
