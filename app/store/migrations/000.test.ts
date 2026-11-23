import migrate from './000';

describe('Migration #0', () => {
  it('groups the address book by chain id', () => {
    const oldState = {
      engine: {
        backgroundState: {
          AddressBookController: {
            addressBook: {
              '0xA': { address: '0xA', chainId: 1 },
              '0xB': { address: '0xB', chainId: '1' },
              '0xC': { address: '0xC', chainId: 5 },
            },
          },
        },
      },
    };

    expect(migrate(oldState)).toStrictEqual({
      engine: {
        backgroundState: {
          AddressBookController: {
            addressBook: {
              1: {
                '0xA': { address: '0xA', chainId: 1 },
                '0xB': { address: '0xB', chainId: '1' },
              },
              5: { '0xC': { address: '0xC', chainId: 5 } },
            },
          },
        },
      },
    });
  });
});
