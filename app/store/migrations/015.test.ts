import migrate from './015';

describe('Migration #15', () => {
  it('should not change state for a non-deprecated network', () => {
    const oldState = {
      engine: {
        backgroundState: {
          NetworkController: {
            providerConfig: { chainId: '1' },
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState).toStrictEqual(oldState);
  });
});
