import migrate from './016';

describe('Migration #16', () => {
  it('moves NetworkController.properties to networkDetails and removes properties', () => {
    const properties = { isEIP1559Compatible: true };
    const oldState = {
      engine: {
        backgroundState: {
          NetworkController: {
            network: '1',
            properties,
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState).toStrictEqual({
      engine: {
        backgroundState: {
          NetworkController: {
            network: '1',
            networkDetails: { isEIP1559Compatible: true },
          },
        },
      },
    });
    expect(
      newState.engine.backgroundState.NetworkController.networkDetails,
    ).toBe(properties);
    expect(
      newState.engine.backgroundState.NetworkController,
    ).not.toHaveProperty('properties');
  });

  it('does not change state if properties is missing', () => {
    const oldState = {
      engine: {
        backgroundState: {
          NetworkController: {
            network: '1',
            networkDetails: { isEIP1559Compatible: false },
          },
        },
      },
    };
    const expected = JSON.parse(JSON.stringify(oldState));

    const newState = migrate(oldState);

    expect(newState).toStrictEqual(expected);
  });
});
