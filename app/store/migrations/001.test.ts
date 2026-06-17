import migrate from './001';

describe('Migration #1', () => {
  it('should leave an empty token list unchanged', () => {
    const oldState = {
      engine: {
        backgroundState: {
          TokensController: {
            tokens: [],
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState).toStrictEqual(oldState);
  });
});
