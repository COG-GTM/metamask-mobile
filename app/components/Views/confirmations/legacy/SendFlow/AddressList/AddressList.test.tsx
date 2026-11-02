import React from 'react';
import { act, waitFor } from '@testing-library/react-native';
import renderWithProvider from '../../../../../../util/test/renderWithProvider';
import { backgroundState } from '../../../../../../util/test/initial-root-state';
import AddressList from '.';
import { createMockAccountsControllerState } from '../../../../../../util/test/accountsControllerTestUtils';
import { isSmartContractAddress } from '../../../../../../util/transactions';

const MOCK_ADDRESS = '0xC4955C0d639D99699Bfd7Ec54d9FaFEe40e4D272';

const MOCK_ACCOUNTS_CONTROLLER_STATE = createMockAccountsControllerState([
  MOCK_ADDRESS,
]);

jest.mock('../../../../../../core/Engine', () => {
  const { MOCK_ACCOUNTS_CONTROLLER_STATE: mockAccountsControllerState } =
    jest.requireActual(
      '../../../../../../util/test/accountsControllerTestUtils',
    );
  return {
    context: {
      KeyringController: {
        state: {
          keyrings: [],
        },
      },
      AccountsController: {
        ...mockAccountsControllerState,
        state: mockAccountsControllerState,
      },
    },
  };
});

jest.mock('../../../../../../util/transactions', () => ({
  ...jest.requireActual('../../../../../../util/transactions'),
  isSmartContractAddress: jest.fn(),
}));

const mockIsSmartContractAddress = isSmartContractAddress as jest.Mock;

const initialState = {
  engine: {
    backgroundState: {
      ...backgroundState,
      AddressBookController: {
        addressBook: {
          '0x1': {
            [MOCK_ADDRESS]: {
              address: MOCK_ADDRESS,
              chainId: '0x1',
              isEns: false,
              memo: '',
              name: 'aa',
            },
          },
        },
      },
      AccountsController: MOCK_ACCOUNTS_CONTROLLER_STATE,
    },
  },
};

// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderComponent = (state: any) =>
  renderWithProvider(
    <AddressList
      onIconPress={() => null}
      onAccountLongPress={() => null}
      onAccountPress={() => null}
      chainId="0x1"
      inputSearch=""
      reloadAddressList={false}
    />,
    { state },
  );

const CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000Bad';
const ALICE_ADDRESS = '0x1111111111111111111111111111111111111111';
const ALBERT_ADDRESS = '0x2222222222222222222222222222222222222222';
const BOB_ADDRESS = '0x3333333333333333333333333333333333333333';

const contact = (address: string, name: string, chainId = '0x1') => ({
  address,
  chainId,
  isEns: false,
  memo: '',
  name,
});

const stateWithContacts = {
  engine: {
    backgroundState: {
      ...backgroundState,
      AddressBookController: {
        addressBook: {
          '0x1': {
            [ALICE_ADDRESS]: contact(ALICE_ADDRESS, 'Alice'),
            [ALBERT_ADDRESS]: contact(ALBERT_ADDRESS, 'Albert'),
            [BOB_ADDRESS]: contact(BOB_ADDRESS, 'Bob'),
            [CONTRACT_ADDRESS]: contact(CONTRACT_ADDRESS, 'Contract'),
          },
          '0x5': {
            [BOB_ADDRESS]: contact(BOB_ADDRESS, 'Bob Goerli', '0x5'),
          },
        },
      },
      AccountsController: MOCK_ACCOUNTS_CONTROLLER_STATE,
    },
  },
};

interface AddressListTestProps {
  chainId?: string;
  inputSearch?: string;
  onlyRenderAddressBook?: boolean;
}

const addressList = ({
  chainId = '0x1',
  inputSearch = '',
  onlyRenderAddressBook = false,
}: AddressListTestProps = {}) => (
  <AddressList
    onIconPress={() => null}
    onAccountLongPress={() => null}
    onAccountPress={() => null}
    chainId={chainId}
    inputSearch={inputSearch}
    onlyRenderAddressBook={onlyRenderAddressBook}
    reloadAddressList={false}
  />
);

describe('AddressList', () => {
  beforeEach(() => {
    mockIsSmartContractAddress.mockReset();
    mockIsSmartContractAddress.mockImplementation(
      async (address: string) =>
        address.toLowerCase() === CONTRACT_ADDRESS.toLowerCase(),
    );
  });

  it('should render correctly', async () => {
    const { toJSON, findByText } = renderComponent(initialState);
    await findByText('aa');
    expect(toJSON()).toMatchSnapshot();
  });

  it('checks each contact for contract code once on mount', async () => {
    const { findByText } = renderWithProvider(addressList(), {
      state: stateWithContacts,
    });

    await findByText('Alice');

    expect(mockIsSmartContractAddress).toHaveBeenCalledTimes(4);
    expect(
      mockIsSmartContractAddress.mock.calls.map(([address]) => address).sort(),
    ).toEqual(
      [ALICE_ADDRESS, ALBERT_ADDRESS, BOB_ADDRESS, CONTRACT_ADDRESS].sort(),
    );
  });

  it('filters search keystrokes without new contract code lookups', async () => {
    const { findByText, queryByText, rerender } = renderWithProvider(
      addressList(),
      { state: stateWithContacts },
    );
    await findByText('Bob');

    for (const inputSearch of ['A', 'Al', 'Ali', 'Alic', 'Alice']) {
      rerender(addressList({ inputSearch }));
    }

    await findByText('Alice');
    expect(queryByText('Bob')).toBeNull();
    expect(mockIsSmartContractAddress).toHaveBeenCalledTimes(4);
  });

  it('hides contract contacts in the send flow but keeps them in the address book', async () => {
    const sendFlow = renderWithProvider(addressList(), {
      state: stateWithContacts,
    });
    await sendFlow.findByText('Alice');
    expect(sendFlow.queryByText('Contract')).toBeNull();
    sendFlow.unmount();

    const addressBook = renderWithProvider(
      addressList({ onlyRenderAddressBook: true }),
      { state: stateWithContacts },
    );
    expect(await addressBook.findByText('Contract')).toBeTruthy();
  });

  it('ignores lookups that resolve after the chain changed', async () => {
    const pending: ((isContract: boolean) => void)[] = [];
    mockIsSmartContractAddress.mockImplementation(
      (_address: string, chainId: string) =>
        chainId === '0x1'
          ? new Promise((resolve) => pending.push(resolve))
          : Promise.resolve(false),
    );

    const { findByText, queryByText, rerender } = renderWithProvider(
      addressList(),
      { state: stateWithContacts },
    );
    rerender(addressList({ chainId: '0x5' }));
    await findByText('Bob Goerli');

    await act(async () => {
      pending.forEach((resolve) => resolve(false));
    });

    await waitFor(() => expect(queryByText('Bob Goerli')).toBeTruthy());
    expect(queryByText('Alice')).toBeNull();
  });
});
