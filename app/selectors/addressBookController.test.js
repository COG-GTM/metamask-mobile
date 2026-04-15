
import { selectAddressBook } from './addressBookController';


describe('selectAddressBook', () => {
  it('returns addressBook from state', () => {
    const mockAddressBookControllerState = {
      addressBook: {
        '0x1': {
          '0x123': {
            address: '0x123',
            name: 'Alice',
            chainId: '0x1',
            memo: 'Friend',
            isEns: false
          }
        }
      }
    };

    const mockState = {
      engine: {
        backgroundState: {
          AddressBookController: mockAddressBookControllerState
        }
      }
    };

    expect(selectAddressBook(mockState)).toEqual(
      mockAddressBookControllerState.addressBook
    );
  });
});