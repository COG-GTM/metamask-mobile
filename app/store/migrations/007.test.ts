import migrate from './007';

const ACCOUNT_1 = '0x1111111111111111111111111111111111111111';
const ACCOUNT_2 = '0x2222222222222222222222222222222222222222';

const tokenA = { address: '0xa', symbol: 'A', decimals: 18 };
const tokenB = { address: '0xb', symbol: 'B', decimals: 18 };
const tokenC = { address: '0xc', symbol: 'C', decimals: 6 };

const buildState = (TokensController: Record<string, unknown>) => ({
  engine: { backgroundState: { TokensController } },
});

describe('Migration #7', () => {
  it('re-keys allTokens and ignoredTokens by chainId then account address', () => {
    const ignoredTokens = [tokenC];
    const oldState = buildState({
      allTokens: {
        [ACCOUNT_1]: { '1': [tokenA], '3': [tokenB] },
        [ACCOUNT_2]: { '1': [tokenB] },
      },
      ignoredTokens,
    });

    const newState = migrate(oldState);

    expect(newState.engine.backgroundState.TokensController).toStrictEqual({
      allTokens: {
        '1': { [ACCOUNT_1]: [tokenA], [ACCOUNT_2]: [tokenB] },
        '3': { [ACCOUNT_1]: [tokenB] },
      },
      allIgnoredTokens: {
        '1': { [ACCOUNT_1]: ignoredTokens, [ACCOUNT_2]: ignoredTokens },
        '3': { [ACCOUNT_1]: ignoredTokens },
      },
    });
  });

  it('does not throw and returns empty maps when allTokens is missing', () => {
    const oldState = buildState({ ignoredTokens: [tokenC] });

    expect(() => migrate(oldState)).not.toThrow();
    expect(oldState.engine.backgroundState.TokensController).toStrictEqual({
      allTokens: {},
      allIgnoredTokens: {},
    });
  });

  it('returns empty maps when TokensController is empty', () => {
    const newState = migrate(buildState({}));

    expect(newState.engine.backgroundState.TokensController).toStrictEqual({
      allTokens: {},
      allIgnoredTokens: {},
    });
  });
});
