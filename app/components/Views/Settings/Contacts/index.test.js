import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import renderWithProvider from '../../../../util/test/renderWithProvider';
import { backgroundState } from '../../../../util/test/initial-root-state';
import { createMockAccountsControllerState } from '../../../../util/test/accountsControllerTestUtils';
import Contacts from '.';
import { ContactsViewSelectorIDs } from '../../../../../e2e/selectors/Settings/Contacts/ContacsView.selectors';

jest.mock('../../../../util/transactions', () => ({
  ...jest.requireActual('../../../../util/transactions'),
  isSmartContractAddress: jest.fn().mockResolvedValue(false),
}));

const ACCOUNT_ADDRESS = '0xC4955C0d639D99699Bfd7Ec54d9FaFEe40e4D272';
const CONTACT_ADDRESS_1 = '0xC4966c0D659D99699BFD7EB54D8fafEE40e4a756';
const CONTACT_ADDRESS_2 = '0xC4977C0d679D99699Bfd7Ec54d9FaFEe40e4D111';

const MOCK_ACCOUNTS_CONTROLLER_STATE = createMockAccountsControllerState([
  ACCOUNT_ADDRESS,
]);

const initialState = {
  user: {
    ambiguousAddressEntries: {},
  },
  engine: {
    backgroundState: {
      ...backgroundState,
      AddressBookController: {
        addressBook: {
          '0x1': {
            [CONTACT_ADDRESS_1]: {
              address: CONTACT_ADDRESS_1,
              chainId: '0x1',
              isEns: false,
              memo: '',
              name: 'Myth',
            },
            [CONTACT_ADDRESS_2]: {
              address: CONTACT_ADDRESS_2,
              chainId: '0x1',
              isEns: false,
              memo: '',
              name: 'Moon',
            },
          },
        },
      },
      AccountsController: MOCK_ACCOUNTS_CONTROLLER_STATE,
    },
  },
};

const navigation = {
  navigate: jest.fn(),
  setOptions: jest.fn(),
};

describe('Contacts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('filters the contacts list from the search field', async () => {
    const { getByTestId, getByText, queryByText } = renderWithProvider(
      <Contacts navigation={navigation} />,
      {
        state: initialState,
      },
    );

    await waitFor(() => {
      expect(getByText('Myth')).toBeTruthy();
      expect(getByText('Moon')).toBeTruthy();
    });

    fireEvent.changeText(
      getByTestId(ContactsViewSelectorIDs.SEARCH_INPUT),
      'moon',
    );

    await waitFor(() => {
      expect(getByText('Moon')).toBeTruthy();
      expect(queryByText('Myth')).toBeNull();
    });
  });
});
