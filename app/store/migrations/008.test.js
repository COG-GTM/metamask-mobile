import migrate from './008';

describe('Migration #008', () => {
  it('normalizes ignored tokens to address strings', () => {
    const state = {
      engine: {
        backgroundState: {
          TokensController: {
            allTokens: {},
            ignoredTokens: ['0x1', { address: '0x2' }, {}, null],
            allIgnoredTokens: {
              '1': {
                '0xa': [{ address: '0x3' }, '0x4'],
                '0xb': ['0x5'],
              },
            },
          },
        },
      },
    };
    expect(migrate(state).engine.backgroundState.TokensController).toEqual({
      allTokens: {},
      ignoredTokens: ['0x1', '0x2'],
      allIgnoredTokens: { '1': { '0xa': ['0x3', '0x4'], '0xb': ['0x5'] } },
    });
  });

  it('defaults missing ignored tokens', () => {
    const state = {
      engine: { backgroundState: { TokensController: {} } },
    };
    expect(migrate(state).engine.backgroundState.TokensController).toEqual({
      allIgnoredTokens: {},
      ignoredTokens: [],
    });
  });
});
