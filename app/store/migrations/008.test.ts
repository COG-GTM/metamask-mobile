import migrate from './008';

describe('Migration #8', () => {
  it('should normalize ignored tokens on the TokensController', () => {
    const oldState = {
      engine: {
        backgroundState: {
          TokensController: {},
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState).toStrictEqual({
      engine: {
        backgroundState: {
          TokensController: {
            allIgnoredTokens: {},
            ignoredTokens: [],
          },
        },
      },
    });
  });
});
