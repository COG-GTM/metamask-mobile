import migrate from './007';

describe('Migration #7', () => {
  it('re-keys tokens and ignored tokens by chain id then account', () => {
    const oldState = {
      engine: {
        backgroundState: {
          TokensController: {
            allTokens: {
              '0xA': { 1: ['t1'], 5: ['t5'] },
              '0xB': { 1: ['t2'] },
            },
            ignoredTokens: ['i'],
          },
        },
      },
    };

    expect(migrate(oldState)).toStrictEqual({
      engine: {
        backgroundState: {
          TokensController: {
            allTokens: {
              1: { '0xA': ['t1'], '0xB': ['t2'] },
              5: { '0xA': ['t5'] },
            },
            allIgnoredTokens: {
              1: { '0xA': ['i'], '0xB': ['i'] },
              5: { '0xA': ['i'] },
            },
          },
        },
      },
    });
  });
});
