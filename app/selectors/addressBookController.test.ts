import { RootState } from '../reducers';
import {
  selectAddressBook,
  selectAddressBookByChain,
} from './addressBookController';
import { AddressBookControllerState } from '@metamask/address-book-controller';

describe('selectAddressBook', () => {
  it('returns addressBook from state', () => {
    const mockAddressBookControllerState: AddressBookControllerState = {
      addressBook: {
        '0x1': {
          '0x123': {
            address: '0x123',
            name: 'Alice',
            chainId: '0x1',
            memo: 'Friend',
            isEns: false,
          },
        },
      },
    };

    const mockState = {
      engine: {
        backgroundState: {
          AddressBookController: mockAddressBookControllerState,
        },
      },
    };

    expect(selectAddressBook(mockState as RootState)).toEqual(
      mockAddressBookControllerState.addressBook,
    );
  });
});

describe('selectAddressBookByChain', () => {
  const aliceEntry = {
    address: '0x123',
    name: 'Alice',
    chainId: '0x1' as const,
    memo: 'Friend',
    isEns: false,
  };
  const bobEntry = {
    address: '0x456',
    name: 'Bob',
    chainId: '0x1' as const,
    memo: '',
    isEns: false,
  };
  const carolEntry = {
    address: '0x789',
    name: 'Carol',
    chainId: '0x89' as const,
    memo: '',
    isEns: false,
  };

  const mockState = {
    engine: {
      backgroundState: {
        AddressBookController: {
          addressBook: {
            '0x1': {
              '0x123': aliceEntry,
              '0x456': bobEntry,
            },
            '0x89': {
              '0x789': carolEntry,
            },
          },
        },
      },
    },
  } as unknown as RootState;

  it('returns the contacts for a chain that has address book entries', () => {
    expect(selectAddressBookByChain(mockState, '0x1')).toEqual([
      aliceEntry,
      bobEntry,
    ]);
    expect(selectAddressBookByChain(mockState, '0x89')).toEqual([carolEntry]);
  });

  it('returns an empty array for a chain with no address book entries', () => {
    expect(selectAddressBookByChain(mockState, '0xa')).toEqual([]);
  });

  it('returns an empty array when the address book is empty', () => {
    const emptyState = {
      engine: {
        backgroundState: {
          AddressBookController: { addressBook: {} },
        },
      },
    } as unknown as RootState;

    expect(selectAddressBookByChain(emptyState, '0x1')).toEqual([]);
  });
});
