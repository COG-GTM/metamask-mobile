import migrate from './016';

describe('Migration #16', () => {
  it('should rename properties to networkDetails', () => {
    const oldState = {
      engine: {
        backgroundState: {
          NetworkController: {
            properties: {
              isEIP1559Compatible: true,
            },
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState.engine.backgroundState.NetworkController.networkDetails).toStrictEqual({
      isEIP1559Compatible: true,
    });
    expect(newState.engine.backgroundState.NetworkController.properties).toBeUndefined();
  });

  it('should not change state if properties does not exist', () => {
    const oldState = {
      engine: {
        backgroundState: {
          NetworkController: {
            networkDetails: {
              isEIP1559Compatible: false,
            },
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState.engine.backgroundState.NetworkController.networkDetails).toStrictEqual({
      isEIP1559Compatible: false,
    });
  });
});
