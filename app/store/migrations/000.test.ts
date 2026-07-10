import migrate from './000';

describe('Migration #0', () => {
  it('should reorganize address book by chain ID', () => {
    const oldState = {
      engine: {
        backgroundState: {
          AddressBookController: {
            addressBook: {
              '0x1': { address: '0x1', chainId: 1, name: 'Account 1' },
              '0x2': { address: '0x2', chainId: 4, name: 'Account 2' },
            },
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(
      newState.engine.backgroundState.AddressBookController.addressBook,
    ).toStrictEqual({
      '1': { '0x1': { address: '0x1', chainId: 1, name: 'Account 1' } },
      '4': { '0x2': { address: '0x2', chainId: 4, name: 'Account 2' } },
    });
  });
});
