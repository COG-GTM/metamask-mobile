import migrate from './008';

describe('Migration #08', () => {
  it('should reduce ignored tokens to address strings', () => {
    const oldState = {
      engine: {
        backgroundState: {
          TokensController: {
            allTokens: {},
            allIgnoredTokens: {
              '1': {
                '0xAccount': [
                  { address: '0xToken1', symbol: 'T1' },
                  '0xToken2',
                ],
              },
            },
            ignoredTokens: [
              { address: '0xToken3', symbol: 'T3' },
              '0xToken4',
            ],
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState.engine.backgroundState.TokensController.ignoredTokens).toStrictEqual([
      '0xToken3',
      '0xToken4',
    ]);
    expect(newState.engine.backgroundState.TokensController.allIgnoredTokens['1']['0xAccount']).toStrictEqual([
      '0xToken1',
      '0xToken2',
    ]);
  });

  it('should handle empty ignored tokens', () => {
    const oldState = {
      engine: {
        backgroundState: {
          TokensController: {
            allTokens: {},
            allIgnoredTokens: {},
            ignoredTokens: [],
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState.engine.backgroundState.TokensController.ignoredTokens).toStrictEqual([]);
    expect(newState.engine.backgroundState.TokensController.allIgnoredTokens).toStrictEqual({});
  });

  it('should handle missing allIgnoredTokens and ignoredTokens', () => {
    const oldState = {
      engine: {
        backgroundState: {
          TokensController: {
            allTokens: {},
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState.engine.backgroundState.TokensController.ignoredTokens).toStrictEqual([]);
    expect(newState.engine.backgroundState.TokensController.allIgnoredTokens).toStrictEqual({});
  });
});
