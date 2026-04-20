import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { useNavigation } from '@react-navigation/native';
import renderWithProvider from '../../../../../../util/test/renderWithProvider';
import { backgroundState } from '../../../../../../util/test/initial-root-state';
import ChangePassword from './ChangePassword';
import Routes from '../../../../../../constants/navigation/Routes';
import { SecurityPrivacyViewSelectorsIDs } from '../../../../../../../e2e/selectors/Settings/SecurityAndPrivacy/SecurityPrivacyView.selectors';

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

describe('ChangePassword', () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    mockNavigate.mockReset();
    (useNavigation as jest.Mock).mockReturnValue({ navigate: mockNavigate });
  });

  it('renders correctly', () => {
    const { toJSON } = renderWithProvider(<ChangePassword />, {
      state: initialState,
    });
    expect(toJSON()).toMatchSnapshot();
  });

  it('navigates to change password screen on button press', () => {
    const { getByTestId } = renderWithProvider(<ChangePassword />, {
      state: initialState,
    });

    fireEvent.press(
      getByTestId(SecurityPrivacyViewSelectorsIDs.CHANGE_PASSWORD_BUTTON),
    );

    expect(mockNavigate).toHaveBeenCalledWith(Routes.SETTINGS.CHANGE_PASSWORD);
  });
});
