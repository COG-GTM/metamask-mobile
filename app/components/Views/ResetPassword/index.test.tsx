import React from 'react';
import { shallow } from 'enzyme';
import { Alert, InteractionManager } from 'react-native';
import { fireEvent, waitFor } from '@testing-library/react-native';
import ResetPassword from './';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { backgroundState } from '../../../util/test/initial-root-state';
import renderWithProvider from '../../../util/test/renderWithProvider';
import { strings } from '../../../../locales/i18n';
import { ChoosePasswordSelectorsIDs } from '../../../../e2e/selectors/Onboarding/ChoosePassword.selectors';
import { recreateVaultWithNewPassword } from '../../../core/Vault';
import { Authentication } from '../../../core';
import Logger from '../../../util/Logger';
import NotificationManager from '../../../core/NotificationManager';

const MOCK_SELECTED_ADDRESS = '0xC4955C0d639D99699Bfd7Ec54d9FaFEe40e4D272';
const ORIGINAL_PASSWORD = 'OriginalPassword1';
const NEW_PASSWORD = 'BrandNewPassword2';
const MOCK_AUTH_TYPE = 'mock-auth-type';

const mockExportSeedPhrase = jest.fn();

jest.mock('../../../core/Engine', () => ({
  context: {
    KeyringController: {
      exportSeedPhrase: (password: string) => mockExportSeedPhrase(password),
    },
  },
}));

jest.mock('../../../core', () => ({
  Authentication: {
    getType: jest.fn(),
    resetPassword: jest.fn(),
    componentAuthenticationType: jest.fn(),
    storePassword: jest.fn(),
  },
}));

jest.mock('../../../core/Vault', () => ({
  recreateVaultWithNewPassword: jest.fn(),
}));

jest.mock('../../../util/Logger', () => ({
  error: jest.fn(),
  log: jest.fn(),
}));

jest.mock('../../../core/NotificationManager', () => ({
  showSimpleNotification: jest.fn(),
}));

jest.mock('../../../store/storage-wrapper', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../../selectors/accountsController', () => ({
  ...jest.requireActual('../../../selectors/accountsController'),
  selectSelectedInternalAccountFormattedAddress: () =>
    '0xC4955C0d639D99699Bfd7Ec54d9FaFEe40e4D272',
}));

const mockStore = configureMockStore();
const initialState = {
  user: {
    passwordSet: true,
    seedphraseBackedUp: false,
  },
  engine: {
    backgroundState,
  },
};
const store = mockStore(initialState);

describe('ChoosePassword', () => {
  it('should render correctly', () => {
    const wrapper = shallow(
      <Provider store={store}>
        <ResetPassword />
      </Provider>,
    );
    expect(wrapper).toMatchSnapshot();
  });
});

describe('ResetPassword', () => {
  describe('change password flow', () => {
    const mockNavigation = {
      navigate: jest.fn(),
      push: jest.fn(),
      setOptions: jest.fn(),
      setParams: jest.fn(),
    };

    const renderResetPassword = () =>
      renderWithProvider(
        <ResetPassword navigation={mockNavigation} route={{ params: {} }} />,
        { state: initialState },
        false,
      );

    const confirmCurrentPassword = async (
      utils: ReturnType<typeof renderResetPassword>,
      password: string,
    ) => {
      await waitFor(() =>
        expect(
          utils.getByText(strings('manual_backup_step_1.confirm_password')),
        ).toBeTruthy(),
      );
      fireEvent.changeText(
        utils.getByTestId(ChoosePasswordSelectorsIDs.NEW_PASSWORD_INPUT_ID),
        password,
      );
      fireEvent.press(
        utils.getByTestId(ChoosePasswordSelectorsIDs.SUBMIT_BUTTON_ID),
      );
    };

    const unlockAndSubmitNewPassword = async (
      utils: ReturnType<typeof renderResetPassword>,
    ) => {
      await confirmCurrentPassword(utils, ORIGINAL_PASSWORD);
      await waitFor(() =>
        expect(
          utils.getByTestId(ChoosePasswordSelectorsIDs.CONTAINER_ID),
        ).toBeTruthy(),
      );
      fireEvent.changeText(
        utils.getByTestId(ChoosePasswordSelectorsIDs.NEW_PASSWORD_INPUT_ID),
        NEW_PASSWORD,
      );
      fireEvent.changeText(
        utils.getByTestId(ChoosePasswordSelectorsIDs.CONFIRM_PASSWORD_INPUT_ID),
        NEW_PASSWORD,
      );
      fireEvent.press(
        utils.getByTestId(
          ChoosePasswordSelectorsIDs.ANDROID_I_UNDERSTAND_BUTTON_ID,
        ),
      );
      fireEvent.press(
        utils.getByTestId(ChoosePasswordSelectorsIDs.SUBMIT_BUTTON_ID),
      );
    };

    beforeEach(() => {
      jest.clearAllMocks();
      mockExportSeedPhrase.mockResolvedValue(['seed']);
      (Authentication.getType as jest.Mock).mockResolvedValue({
        currentAuthType: 'password',
        availableBiometryType: undefined,
      });
      (Authentication.resetPassword as jest.Mock).mockResolvedValue(undefined);
      (
        Authentication.componentAuthenticationType as jest.Mock
      ).mockResolvedValue({ currentAuthType: MOCK_AUTH_TYPE });
      (Authentication.storePassword as jest.Mock).mockResolvedValue(undefined);
      (recreateVaultWithNewPassword as jest.Mock).mockResolvedValue(undefined);
      jest
        .spyOn(InteractionManager, 'runAfterInteractions')
        .mockImplementation((task) => {
          if (typeof task === 'function') task();
          return {
            then: jest.fn(),
            done: jest.fn(),
            cancel: jest.fn(),
          } as unknown as ReturnType<
            typeof InteractionManager.runAfterInteractions
          >;
        });
      jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('shows the incorrect password warning and stays on the confirm view when the current password is wrong', async () => {
      mockExportSeedPhrase.mockRejectedValue(new Error('Invalid password'));
      const utils = renderResetPassword();

      await confirmCurrentPassword(utils, 'wrong-password');

      await waitFor(() =>
        expect(
          utils.getByText(
            strings('reveal_credential.warning_incorrect_password'),
          ),
        ).toBeTruthy(),
      );
      expect(mockExportSeedPhrase).toHaveBeenCalledWith('wrong-password');
      expect(
        utils.getByText(strings('manual_backup_step_1.confirm_password')),
      ).toBeTruthy();
      expect(
        utils.queryByTestId(ChoosePasswordSelectorsIDs.CONTAINER_ID),
      ).toBeNull();
      expect(recreateVaultWithNewPassword).not.toHaveBeenCalled();
    });

    it('re-encrypts the vault with (original, new, selectedAddress) and navigates to SecuritySettings', async () => {
      const utils = renderResetPassword();

      await unlockAndSubmitNewPassword(utils);

      await waitFor(() =>
        expect(mockNavigation.navigate).toHaveBeenCalledWith(
          'SecuritySettings',
        ),
      );
      expect(mockExportSeedPhrase).toHaveBeenCalledWith(ORIGINAL_PASSWORD);
      expect(recreateVaultWithNewPassword).toHaveBeenCalledTimes(1);
      expect(recreateVaultWithNewPassword).toHaveBeenCalledWith(
        ORIGINAL_PASSWORD,
        NEW_PASSWORD,
        MOCK_SELECTED_ADDRESS,
      );
      expect(Authentication.resetPassword).toHaveBeenCalledTimes(1);
      expect(
        (recreateVaultWithNewPassword as jest.Mock).mock.invocationCallOrder[0],
      ).toBeLessThan(
        (Authentication.resetPassword as jest.Mock).mock.invocationCallOrder[0],
      );
      expect(Authentication.storePassword).toHaveBeenCalledWith(
        NEW_PASSWORD,
        MOCK_AUTH_TYPE,
      );
      expect(NotificationManager.showSimpleNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          title: strings('reset_password.password_updated'),
        }),
      );
      expect(Logger.error).not.toHaveBeenCalled();
    });

    it('logs the error and still completes the flow when storePassword rejects', async () => {
      const storeError = new Error('Keychain write failed');
      (Authentication.storePassword as jest.Mock).mockRejectedValue(storeError);
      const utils = renderResetPassword();

      await unlockAndSubmitNewPassword(utils);

      await waitFor(() =>
        expect(mockNavigation.navigate).toHaveBeenCalledWith(
          'SecuritySettings',
        ),
      );
      expect(Logger.error).toHaveBeenCalledWith(storeError);
      expect(recreateVaultWithNewPassword).toHaveBeenCalledWith(
        ORIGINAL_PASSWORD,
        NEW_PASSWORD,
        MOCK_SELECTED_ADDRESS,
      );
      expect(NotificationManager.showSimpleNotification).toHaveBeenCalled();
    });

    it('shows the security alert when the passcode is not set', async () => {
      (recreateVaultWithNewPassword as jest.Mock).mockRejectedValue(
        new Error('Passcode not set.'),
      );
      const utils = renderResetPassword();

      await unlockAndSubmitNewPassword(utils);

      await waitFor(() =>
        expect(Alert.alert).toHaveBeenCalledWith(
          strings('choose_password.security_alert_title'),
          strings('choose_password.security_alert_message'),
        ),
      );
      expect(mockNavigation.navigate).not.toHaveBeenCalled();
      expect(Authentication.resetPassword).not.toHaveBeenCalled();
      expect(utils.queryByText('Error: Passcode not set.')).toBeNull();
      expect(
        utils.getByTestId(ChoosePasswordSelectorsIDs.CONTAINER_ID),
      ).toBeTruthy();
    });

    it('renders the error when re-encrypting the vault fails', async () => {
      (recreateVaultWithNewPassword as jest.Mock).mockRejectedValue(
        new Error('Vault re-encryption failed'),
      );
      const utils = renderResetPassword();

      await unlockAndSubmitNewPassword(utils);

      await waitFor(() =>
        expect(
          utils.getByText('Error: Vault re-encryption failed'),
        ).toBeTruthy(),
      );
      expect(Alert.alert).not.toHaveBeenCalled();
      expect(mockNavigation.navigate).not.toHaveBeenCalled();
      expect(Authentication.resetPassword).not.toHaveBeenCalled();
      expect(Authentication.storePassword).not.toHaveBeenCalled();
    });
  });
});
