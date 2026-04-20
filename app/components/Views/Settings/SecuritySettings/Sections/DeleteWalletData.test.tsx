import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { useNavigation } from '@react-navigation/native';
import renderWithProvider from '../../../../../util/test/renderWithProvider';
import { backgroundState } from '../../../../../util/test/initial-root-state';
import DeleteWalletData from './DeleteWalletData';
import Routes from '../../../../../constants/navigation/Routes';
import { SECURITY_SETTINGS_DELETE_WALLET_BUTTON } from '../SecuritySettings.constants';

jest.mock('@metamask/react-native-button', () => 'MetaMaskButton');

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: jest.fn(),
  };
});

const initialState = {
  engine: { backgroundState },
};

describe('DeleteWalletData', () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    mockNavigate.mockReset();
    (useNavigation as jest.Mock).mockReturnValue({ navigate: mockNavigate });
  });

  it('renders correctly', () => {
    const { toJSON } = renderWithProvider(<DeleteWalletData />, {
      state: initialState,
    });
    expect(toJSON()).toMatchSnapshot();
  });

  it('navigates to the delete wallet modal when pressed', () => {
    const { getByTestId } = renderWithProvider(<DeleteWalletData />, {
      state: initialState,
    });

    fireEvent.press(getByTestId(SECURITY_SETTINGS_DELETE_WALLET_BUTTON));

    expect(mockNavigate).toHaveBeenCalledWith(Routes.MODAL.ROOT_MODAL_FLOW, {
      screen: Routes.MODAL.DELETE_WALLET,
    });
  });
});
