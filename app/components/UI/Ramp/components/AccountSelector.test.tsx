import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import renderWithProvider from '../../../../util/test/renderWithProvider';
import { createMockAccountsControllerState } from '../../../../util/test/accountsControllerTestUtils';
import { MOCK_KEYRING_CONTROLLER_STATE } from '../../../../util/test/keyringControllerTestUtils';
import { backgroundState } from '../../../../util/test/initial-root-state';
import AccountSelector from './AccountSelector';

const MOCK_ADDRESS = '0xAbCdef1234567890abcdef1234567890ABCdef12';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const buildState = (withAccounts = true): any => ({
  engine: {
    backgroundState: {
      ...backgroundState,
      AccountsController: withAccounts
        ? createMockAccountsControllerState([MOCK_ADDRESS], MOCK_ADDRESS)
        : backgroundState.AccountsController,
      KeyringController: MOCK_KEYRING_CONTROLLER_STATE,
    },
  },
});

describe('AccountSelector', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders the selected account', () => {
    const { toJSON } = renderWithProvider(<AccountSelector />, {
      state: buildState(),
    });
    expect(toJSON()).toMatchSnapshot();
  });

  it('shows a loading placeholder when there is no selected address', () => {
    const { getByText } = renderWithProvider(<AccountSelector />, {
      state: buildState(false),
    });
    expect(getByText('Account is loading...')).toBeDefined();
  });

  it('navigates to the account selector when pressed', () => {
    const { getByText } = renderWithProvider(<AccountSelector />, {
      state: buildState(false),
    });
    fireEvent.press(getByText('Account is loading...'));
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        params: expect.objectContaining({ disablePrivacyMode: true }),
      }),
    );
  });
});
