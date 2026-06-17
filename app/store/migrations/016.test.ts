import migrate from './016';

describe('Migration #16', () => {
  it('should rename network properties to networkDetails', () => {
    const oldState = {
      engine: {
        backgroundState: {
          NetworkController: {
            properties: { foo: 'bar' },
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState).toStrictEqual({
      engine: {
        backgroundState: {
          NetworkController: {
            networkDetails: { foo: 'bar' },
          },
        },
      },
    });
  });
});
