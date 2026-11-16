import migrate from './000';

const buildState = (addressBook: Record<string, unknown>) => ({
  engine: {
    backgroundState: {
      AddressBookController: { addressBook },
    },
  },
});

describe('Migration #0', () => {
  it('groups addresses on the same chain under a single chainId key', () => {
    const contactA = {
      address: '0xA',
      chainId: '1',
      memo: '',
      name: 'Alice',
    };
    const contactB = {
      address: '0xB',
      chainId: '1',
      memo: 'friend',
      name: 'Bob',
    };

    const newState = migrate(buildState({ '0xA': contactA, '0xB': contactB }));

    expect(
      newState.engine.backgroundState.AddressBookController.addressBook,
    ).toStrictEqual({
      '1': { '0xA': contactA, '0xB': contactB },
    });
  });

  it('splits addresses on different chains into separate chainId keys', () => {
    const mainnetContact = {
      address: '0xA',
      chainId: '1',
      memo: '',
      name: 'Mainnet',
    };
    const goerliContact = {
      address: '0xB',
      chainId: '5',
      memo: '',
      name: 'Goerli',
    };
    const secondMainnetContact = {
      address: '0xC',
      chainId: '1',
      memo: '',
      name: 'Mainnet 2',
    };

    const newState = migrate(
      buildState({
        '0xA': mainnetContact,
        '0xB': goerliContact,
        '0xC': secondMainnetContact,
      }),
    );

    expect(
      newState.engine.backgroundState.AddressBookController.addressBook,
    ).toStrictEqual({
      '1': { '0xA': mainnetContact, '0xC': secondMainnetContact },
      '5': { '0xB': goerliContact },
    });
  });

  it('converts numeric chainIds to string keys', () => {
    const contact = { address: '0xA', chainId: 1, memo: '', name: 'Alice' };

    const newState = migrate(buildState({ '0xA': contact }));

    expect(
      newState.engine.backgroundState.AddressBookController.addressBook,
    ).toStrictEqual({ '1': { '0xA': contact } });
  });

  it('returns an empty address book when there are no contacts', () => {
    const newState = migrate(buildState({}));

    expect(
      newState.engine.backgroundState.AddressBookController.addressBook,
    ).toStrictEqual({});
  });

  it('leaves the rest of the state untouched', () => {
    const contact = { address: '0xA', chainId: '1', memo: '', name: 'Alice' };
    const oldState = {
      ...buildState({ '0xA': contact }),
      settings: { primaryCurrency: 'ETH' },
    };

    const newState = migrate(oldState);

    expect(newState.settings).toStrictEqual({ primaryCurrency: 'ETH' });
  });

  it('throws when a contact has no chainId', () => {
    expect(() =>
      migrate(buildState({ '0xA': { address: '0xA', name: 'Alice' } })),
    ).toThrow(TypeError);
  });
});
