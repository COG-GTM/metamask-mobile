import migrate from './007';

describe('Migration #007', () => {
  it('re-keys tokens by chainId then account address', () => {
    const state = {
      engine: {
        backgroundState: {
          TokensController: {
            allTokens: {
              '0xa': { '1': ['t1'], '5': ['t2'] },
              '0xb': { '1': ['t3'] },
            },
            ignoredTokens: ['i1'],
          },
        },
      },
    };
    expect(migrate(state).engine.backgroundState.TokensController).toEqual({
      allTokens: {
        '1': { '0xa': ['t1'], '0xb': ['t3'] },
        '5': { '0xa': ['t2'] },
      },
      allIgnoredTokens: {
        '1': { '0xa': ['i1'], '0xb': ['i1'] },
        '5': { '0xa': ['i1'] },
      },
    });
  });
});
