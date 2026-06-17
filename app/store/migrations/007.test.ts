import migrate from './007';

describe('Migration #7', () => {
  it('should restructure empty token maps by chain ID', () => {
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

    expect(newState).toStrictEqual({
      engine: {
        backgroundState: {
          TokensController: {
            allTokens: {},
            allIgnoredTokens: {},
          },
        },
      },
    });
  });
});
