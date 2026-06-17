import migrate from './014';

describe('Migration #14', () => {
  it('should rename provider to providerConfig', () => {
    const oldState = {
      engine: {
        backgroundState: {
          NetworkController: {
            provider: { type: 'mainnet' },
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState).toStrictEqual({
      engine: {
        backgroundState: {
          NetworkController: {
            providerConfig: { type: 'mainnet' },
          },
        },
      },
    });
  });
});
