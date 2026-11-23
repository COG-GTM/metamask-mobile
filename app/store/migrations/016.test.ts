import migrate from './016';

describe('Migration #16', () => {
  it('moves properties to networkDetails', () => {
    const oldState = {
      engine: {
        backgroundState: {
          NetworkController: { properties: { isEIP1559Compatible: true } },
        },
      },
    };

    expect(migrate(oldState)).toStrictEqual({
      engine: {
        backgroundState: {
          NetworkController: {
            networkDetails: { isEIP1559Compatible: true },
          },
        },
      },
    });
  });

  it('does not change state without properties', () => {
    const oldState = {
      engine: { backgroundState: { NetworkController: {} } },
    };

    expect(migrate(oldState)).toStrictEqual(oldState);
  });
});
