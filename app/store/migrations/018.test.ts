import migrate from './018';

describe('Migration #18', () => {
  it('should remove suggestedAssets from TokensController', () => {
    const oldState = {
      engine: {
        backgroundState: {
          TokensController: {
            tokens: [],
            suggestedAssets: [{ id: '1' }],
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState.engine.backgroundState.TokensController).toStrictEqual({
      tokens: [],
    });
  });

  it('should return state unaltered if there are no suggested assets', () => {
    const oldState = {
      engine: {
        backgroundState: {
          TokensController: { tokens: [] },
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState).toStrictEqual(oldState);
  });
});
