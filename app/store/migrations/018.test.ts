import migrate from './018';

describe('Migration #18', () => {
  it('should remove suggestedAssets from the TokensController', () => {
    const oldState = {
      engine: {
        backgroundState: {
          TokensController: {
            suggestedAssets: [],
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState).toStrictEqual({
      engine: {
        backgroundState: {
          TokensController: {},
        },
      },
    });
  });
});
