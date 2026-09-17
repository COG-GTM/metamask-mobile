import migrate from './016';

describe('Migration #16', () => {
  it('should rename properties to networkDetails', () => {
    const oldState = {
      engine: {
        backgroundState: {
          NetworkController: {
            properties: { isEIP1559Compatible: true },
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState.engine.backgroundState.NetworkController).toStrictEqual({
      networkDetails: { isEIP1559Compatible: true },
    });
  });

  it('should return state unaltered if there are no properties', () => {
    const oldState = {
      engine: {
        backgroundState: {
          NetworkController: {
            networkDetails: { isEIP1559Compatible: true },
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState).toStrictEqual(oldState);
  });
});
