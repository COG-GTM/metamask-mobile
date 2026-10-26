import migrate from './000';

describe('Migration #000', () => {
  it('groups address book entries by chainId', () => {
    const state = {
      engine: {
        backgroundState: {
          AddressBookController: {
            addressBook: {
              '0xa': { address: '0xa', chainId: 1 },
              '0xb': { address: '0xb', chainId: 1 },
              '0xc': { address: '0xc', chainId: 5 },
            },
          },
        },
      },
    };
    const newState = migrate(state);
    expect(
      newState.engine.backgroundState.AddressBookController.addressBook,
    ).toEqual({
      '1': {
        '0xa': { address: '0xa', chainId: 1 },
        '0xb': { address: '0xb', chainId: 1 },
      },
      '5': { '0xc': { address: '0xc', chainId: 5 } },
    });
  });
});
