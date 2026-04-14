import migrate from './000';

describe('Migration #00', () => {
  it('should migrate address book from flat to chainId-keyed structure', () => {
    const oldState = {
      engine: {
        backgroundState: {
          AddressBookController: {
            addressBook: {
              '0x1234': { chainId: 1, address: '0x1234', name: 'Test' },
              '0x5678': { chainId: 1, address: '0x5678', name: 'Test2' },
              '0xabcd': { chainId: 5, address: '0xabcd', name: 'Goerli' },
            },
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState.engine.backgroundState.AddressBookController.addressBook).toStrictEqual({
      '1': {
        '0x1234': { chainId: 1, address: '0x1234', name: 'Test' },
        '0x5678': { chainId: 1, address: '0x5678', name: 'Test2' },
      },
      '5': {
        '0xabcd': { chainId: 5, address: '0xabcd', name: 'Goerli' },
      },
    });
  });

  it('should handle empty address book', () => {
    const oldState = {
      engine: {
        backgroundState: {
          AddressBookController: {
            addressBook: {},
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState.engine.backgroundState.AddressBookController.addressBook).toStrictEqual({});
  });

  it('should handle single entry', () => {
    const oldState = {
      engine: {
        backgroundState: {
          AddressBookController: {
            addressBook: {
              '0x1234': { chainId: 42, address: '0x1234', name: 'Only' },
            },
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState.engine.backgroundState.AddressBookController.addressBook).toStrictEqual({
      '42': {
        '0x1234': { chainId: 42, address: '0x1234', name: 'Only' },
      },
    });
  });
});
