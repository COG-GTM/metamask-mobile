import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { useNavigation } from '@react-navigation/native';
import renderWithProvider from '../../../../../util/test/renderWithProvider';
import { backgroundState } from '../../../../../util/test/initial-root-state';
import RememberMeOptionSection from './RememberMeOptionSection';
import { TURN_ON_REMEMBER_ME } from '../SecuritySettings.constants';
import AUTHENTICATION_TYPE from '../../../../../constants/userProperties';
import { Authentication } from '../../../../../core';
import { setAllowLoginWithRememberMe } from '../../../../../actions/security';
import { createTurnOffRememberMeModalNavDetails } from '../../../../UI/TurnOffRememberMeModal/TurnOffRememberMeModal';

const mockDispatch = jest.fn();

jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');
  return {
    ...actual,
    useDispatch: () => mockDispatch,
  };
});

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: jest.fn(),
  };
});

jest.mock(
  '../../../../UI/TurnOffRememberMeModal/TurnOffRememberMeModal',
  () => ({
    createTurnOffRememberMeModalNavDetails: jest.fn(() => [
      'TurnOffRememberMeModal',
      { param: 'value' },
    ]),
  }),
);

jest.mock('../../../../../core', () => ({
  Authentication: {
    getType: jest.fn(),
  },
}));

const buildState = (allowLoginWithRememberMe: boolean) => ({
  engine: { backgroundState },
  security: { allowLoginWithRememberMe },
});

describe('RememberMeOptionSection', () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockDispatch.mockClear();
    (useNavigation as jest.Mock).mockReturnValue({ navigate: mockNavigate });
    (Authentication.getType as jest.Mock).mockResolvedValue({
      currentAuthType: AUTHENTICATION_TYPE.PASSWORD,
    });
  });

  it('renders correctly', async () => {
    const { toJSON, getByTestId } = renderWithProvider(
      <RememberMeOptionSection />,
      { state: buildState(false) },
    );
    await waitFor(() => expect(getByTestId(TURN_ON_REMEMBER_ME)).toBeTruthy());
    expect(toJSON()).toMatchSnapshot();
  });

  it('dispatches setAllowLoginWithRememberMe when toggled on while not using remember me', async () => {
    const { getByTestId } = renderWithProvider(<RememberMeOptionSection />, {
      state: buildState(false),
    });

    await waitFor(() => expect(getByTestId(TURN_ON_REMEMBER_ME)).toBeTruthy());
    fireEvent(getByTestId(TURN_ON_REMEMBER_ME), 'onValueChange', true);

    expect(mockDispatch).toHaveBeenCalledWith(setAllowLoginWithRememberMe(true));
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('opens the turn off remember me modal when already using remember me', async () => {
    (Authentication.getType as jest.Mock).mockResolvedValue({
      currentAuthType: AUTHENTICATION_TYPE.REMEMBER_ME,
    });
    const { getByTestId } = renderWithProvider(<RememberMeOptionSection />, {
      state: buildState(true),
    });

    await waitFor(() => expect(getByTestId(TURN_ON_REMEMBER_ME)).toBeTruthy());
    fireEvent(getByTestId(TURN_ON_REMEMBER_ME), 'onValueChange', false);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        ...createTurnOffRememberMeModalNavDetails(),
      );
    });
  });
});
