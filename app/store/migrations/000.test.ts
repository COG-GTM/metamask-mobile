import migrate from './000';

describe('Migration #0', () => {
  it('should restructure the address book without changing an empty book', () => {
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

    expect(newState).toStrictEqual(oldState);
  });
});
