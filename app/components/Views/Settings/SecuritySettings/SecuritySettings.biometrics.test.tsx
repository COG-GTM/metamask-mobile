import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, waitFor } from '@testing-library/react-native';
import { BIOMETRY_TYPE } from 'react-native-keychain';
import renderWithProvider from '../../../../util/test/renderWithProvider';
import SecuritySettings from './SecuritySettings';
import { backgroundState } from '../../../../util/test/initial-root-state';
import { SecurityPrivacyViewSelectorsIDs } from '../../../../../e2e/selectors/Settings/SecurityAndPrivacy/SecurityPrivacyView.selectors';
import { MOCK_ACCOUNTS_CONTROLLER_STATE } from '../../../../util/test/accountsControllerTestUtils';
import { Authentication } from '../../../../core';
import Engine from '../../../../core/Engine';
import AUTHENTICATION_TYPE from '../../../../constants/userProperties';

// These legacy packages use RN APIs missing from the test renderer.
jest.mock('@metamask/react-native-button', () => {
  const { TouchableOpacity } = jest.requireActual('react-native');
  return TouchableOpacity;
});
jest.mock('react-native-modal', () => {
  const { View } = jest.requireActual('react-native');
  return View;
});
jest.mock('react-native-material-textfield', () => {
  const { TextInput } = jest.requireActual('react-native');
  return { OutlinedTextField: TextInput };
});

jest.mock('@react-navigation/native', () => {
  const actualReactNavigation = jest.requireActual('@react-navigation/native');
  return {
    ...actualReactNavigation,
    useNavigation: () => ({
      navigate: jest.fn(),
      setOptions: jest.fn(),
      goBack: jest.fn(),
    }),
    useFocusEffect: jest.fn(),
  };
});

jest.mock('@react-native-cookies/cookies', () => ({
  clearAll: jest.fn(),
  getAll: jest.fn().mockResolvedValue({}),
}));

jest.mock('../../../../util/navigation/navUtils', () => ({
  ...jest.requireActual('../../../../util/navigation/navUtils'),
  useParams: jest.fn(() => ({})),
}));

const initialState = {
  privacy: { approvedHosts: {} },
  browser: { history: [] },
  settings: { lockTime: 1000, basicFunctionalityEnabled: true },
  user: { passwordSet: true },
  engine: {
    backgroundState: {
      ...backgroundState,
      AccountsController: MOCK_ACCOUNTS_CONTROLLER_STATE,
      UserStorageController: {
        isProfileSyncingEnabled: false,
      },
    },
  },
  security: {
    allowLoginWithRememberMe: false,
  },
};

describe('SecuritySettings biometrics toggle', () => {
  beforeEach(() => {
    jest.spyOn(Authentication, 'getType').mockResolvedValue({
      currentAuthType: AUTHENTICATION_TYPE.PASSWORD,
      availableBiometryType: BIOMETRY_TYPE.FACE_ID,
    });
    jest
      .spyOn(Authentication, 'getPassword')
      .mockResolvedValue({ password: 'password123' } as never);
    jest.spyOn(Authentication, 'resetPassword').mockResolvedValue();
    Object.assign(Engine.context.KeyringController, {
      exportSeedPhrase: jest.fn().mockResolvedValue([]),
    });
    jest.spyOn(Alert, 'alert');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('stays off and tells the user when the biometric prompt is cancelled', async () => {
    jest.spyOn(Authentication, 'storePassword').mockResolvedValue(false);
    const { findByTestId, getByTestId } = renderWithProvider(
      <SecuritySettings />,
      { state: initialState },
    );
    const toggle = await findByTestId(
      SecurityPrivacyViewSelectorsIDs.BIOMETRICS_TOGGLE,
    );

    await act(async () => {
      fireEvent(toggle, 'onValueChange', true);
    });

    await waitFor(() =>
      expect(Authentication.storePassword).toHaveBeenCalledWith(
        'password123',
        AUTHENTICATION_TYPE.BIOMETRIC,
      ),
    );
    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith(
        'Biometric unlock not turned on',
        expect.stringContaining('password'),
      ),
    );
    expect(
      getByTestId(SecurityPrivacyViewSelectorsIDs.BIOMETRICS_TOGGLE).props
        .value,
    ).toBe(false);
  });

  it('turns on when the biometric credential is stored', async () => {
    jest.spyOn(Authentication, 'storePassword').mockImplementation(async () => {
      jest.spyOn(Authentication, 'getType').mockResolvedValue({
        currentAuthType: AUTHENTICATION_TYPE.BIOMETRIC,
        availableBiometryType: BIOMETRY_TYPE.FACE_ID,
      });
      return true;
    });
    const { findByTestId, getByTestId } = renderWithProvider(
      <SecuritySettings />,
      { state: initialState },
    );
    const toggle = await findByTestId(
      SecurityPrivacyViewSelectorsIDs.BIOMETRICS_TOGGLE,
    );

    await act(async () => {
      fireEvent(toggle, 'onValueChange', true);
    });

    await waitFor(() =>
      expect(
        getByTestId(SecurityPrivacyViewSelectorsIDs.BIOMETRICS_TOGGLE).props
          .value,
      ).toBe(true),
    );
    expect(Alert.alert).not.toHaveBeenCalled();
  });
});
