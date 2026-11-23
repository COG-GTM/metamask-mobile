import migrate from './018';

describe('Migration #18', () => {
  it('removes suggestedAssets', () => {
    const oldState = {
      engine: {
        backgroundState: {
          TokensController: { suggestedAssets: [{}], tokens: [] },
        },
      },
    };

    expect(migrate(oldState)).toStrictEqual({
      engine: { backgroundState: { TokensController: { tokens: [] } } },
    });
  });

  it('does not change state without suggestedAssets', () => {
    const oldState = {
      engine: { backgroundState: { TokensController: { tokens: [] } } },
    };

    expect(migrate(oldState)).toStrictEqual(oldState);
  });
});
