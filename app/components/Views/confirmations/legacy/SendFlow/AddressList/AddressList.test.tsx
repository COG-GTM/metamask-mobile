import React from 'react';
import { waitFor } from '@testing-library/react-native';
import renderWithProvider from '../../../../../../util/test/renderWithProvider';
import { backgroundState } from '../../../../../../util/test/initial-root-state';
import AddressList from '.';
import { createMockAccountsControllerState } from '../../../../../../util/test/accountsControllerTestUtils';
import { isSmartContractAddress } from '../../../../../../util/transactions';
import { SendViewSelectorsIDs } from '../../../../../../../e2e/selectors/SendFlow/SendView.selectors';

const MOCK_ADDRESS = '0xC4955C0d639D99699Bfd7Ec54d9FaFEe40e4D272';
const SECOND_MOCK_ADDRESS = '0x8C6D4A1f3f2E7b5D9a0C1B2e3D4F5a6B7C8D9E0F';

const MOCK_ACCOUNTS_CONTROLLER_STATE = createMockAccountsControllerState([
  MOCK_ADDRESS,
]);

jest.mock('../../../../../../util/transactions', () => ({
  ...jest.requireActual('../../../../../../util/transactions'),
  isSmartContractAddress: jest.fn(),
}));

jest.mock('../../../../../../core/Engine', () => {
  const { MOCK_ACCOUNTS_CONTROLLER_STATE: mockAccountsControllerState } =
    jest.requireActual('../../../../../../util/test/accountsControllerTestUtils');
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

const twoContactState = {
  ...initialState,
  engine: {
    ...initialState.engine,
    backgroundState: {
      ...initialState.engine.backgroundState,
      AddressBookController: {
        addressBook: {
          '0x1': {
            [MOCK_ADDRESS]: {
              address: MOCK_ADDRESS,
              chainId: '0x1',
              isEns: false,
              memo: '',
              name: 'ab',
            },
            [SECOND_MOCK_ADDRESS]: {
              address: SECOND_MOCK_ADDRESS,
              chainId: '0x1',
              isEns: false,
              memo: '',
              name: 'abc',
            },
          },
        },
      },
    },
  },
};

// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderComponent = (state: any, inputSearch = '') =>
  renderWithProvider(
    <AddressList
      onIconPress={() => null}
      onAccountLongPress={() => null}
      onAccountPress={() => null}
      chainId="0x1"
      inputSearch={inputSearch}
      reloadAddressList={false}
    />,
    { state },
  );

describe('AddressList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(isSmartContractAddress).mockResolvedValue(false);
  });

  it('should render correctly', () => {
    const { toJSON } = renderComponent(initialState);
    expect(toJSON()).toMatchSnapshot();
  });

  it('should only call isSmartContractAddress once per contact when inputSearch changes', async () => {
    jest.mocked(isSmartContractAddress).mockResolvedValue(false);
    const { rerender, getAllByTestId } = renderComponent(twoContactState);

    await waitFor(() =>
      expect(isSmartContractAddress).toHaveBeenCalledTimes(2),
    );

    rerender(
      <AddressList
        onIconPress={() => null}
        onAccountLongPress={() => null}
        onAccountPress={() => null}
        chainId="0x1"
        inputSearch="a"
        reloadAddressList={false}
      />,
    );
    rerender(
      <AddressList
        onIconPress={() => null}
        onAccountLongPress={() => null}
        onAccountPress={() => null}
        chainId="0x1"
        inputSearch="ab"
        reloadAddressList={false}
      />,
    );

    await waitFor(() =>
      expect(isSmartContractAddress).toHaveBeenCalledTimes(2),
    );
    expect(getAllByTestId(SendViewSelectorsIDs.ADDRESS_BOOK_ACCOUNT)).toHaveLength(
      2,
    );
  });

  it('should retry classification after a failed lookup', async () => {
    jest
      .mocked(isSmartContractAddress)
      .mockRejectedValueOnce(new Error('lookup failed'))
      .mockResolvedValue(false);
    const { rerender, getByTestId } = renderComponent(initialState);

    await waitFor(() => {
      expect(isSmartContractAddress).toHaveBeenCalledTimes(1);
      expect(
        getByTestId(SendViewSelectorsIDs.ADDRESS_BOOK_ACCOUNT),
      ).toBeDefined();
    });

    rerender(
      <AddressList
        onIconPress={() => null}
        onAccountLongPress={() => null}
        onAccountPress={() => null}
        chainId="0x1"
        inputSearch="a"
        reloadAddressList={false}
      />,
    );

    await waitFor(() =>
      expect(isSmartContractAddress).toHaveBeenCalledTimes(2),
    );
    await waitFor(() =>
      expect(
        getByTestId(SendViewSelectorsIDs.ADDRESS_BOOK_ACCOUNT),
      ).toBeDefined(),
    );
  });
});
