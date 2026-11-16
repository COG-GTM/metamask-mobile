import React from 'react';
import { shallow } from 'enzyme';
import { Alert } from 'react-native';
import { fireEvent, waitFor } from '@testing-library/react-native';
import ChoosePassword from './';
import configureMockStore from 'redux-mock-store';
import {
  ONBOARDING,
  PREVIOUS_SCREEN,
  PROTECT,
} from '../../../constants/navigation';
import { Provider } from 'react-redux';
import { backgroundState } from '../../../util/test/initial-root-state';
import { MOCK_ACCOUNTS_CONTROLLER_STATE } from '../../../util/test/accountsControllerTestUtils';
import renderWithProvider from '../../../util/test/renderWithProvider';
import { ChoosePasswordSelectorsIDs } from '../../../../e2e/selectors/Onboarding/ChoosePassword.selectors';
import { strings } from '../../../../locales/i18n';
import { MetaMetricsEvents } from '../../../core/Analytics';
import AppConstants from '../../../core/AppConstants';
import {
  EXISTING_USER,
  SEED_PHRASE_HINTS,
  TRUE,
} from '../../../constants/storage';
import StorageWrapper from '../../../store/storage-wrapper';
import Logger from '../../../util/Logger';
import trackOnboarding from '../../../util/metrics/TrackOnboarding/trackOnboarding';
import { ITrackingEvent } from '../../../core/Analytics/MetaMetrics.types';

const MOCK_SEED_PHRASE =
  'test test test test test test test test test test test ball';
const PASSCODE_NOT_SET_ERROR_MESSAGE = 'Passcode not set.';
const VALID_PASSWORD = 'Str0ngPassw0rd!';

const mockKeyringController = {
  state: { keyrings: [] as { type: string; accounts: string[] }[] },
  exportSeedPhrase: jest.fn(),
  exportAccount: jest.fn(),
  addNewAccount: jest.fn(),
  importAccountWithStrategy: jest.fn(),
};

jest.mock('../../../core/Engine', () => ({
  context: {
    get KeyringController() {
      return mockKeyringController;
    },
  },
}));

const mockAuthentication = {
  getType: jest.fn(),
  componentAuthenticationType: jest.fn(),
  newWalletAndKeychain: jest.fn(),
  newWalletAndRestore: jest.fn(),
};

jest.mock('../../../core', () => ({
  get Authentication() {
    return mockAuthentication;
  },
}));

jest.mock('../../../store/storage-wrapper', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('../../../util/termsOfUse/termsOfUse', () => jest.fn());
jest.mock('../../../util/metrics/TrackOnboarding/trackOnboarding');
jest.mock('../../../util/Logger', () => ({
  error: jest.fn(),
  log: jest.fn(),
}));

const mockStore = configureMockStore();
const initialState = {
  user: {
    passwordSet: true,
    seedphraseBackedUp: false,
  },
  engine: {
    backgroundState: {
      ...backgroundState,
      AccountsController: MOCK_ACCOUNTS_CONTROLLER_STATE,
    },
  },
};
const store = mockStore(initialState);

const HD_ACCOUNTS = ['0xhd1', '0xhd2', '0xhd3'];
const IMPORTED_ACCOUNTS = ['0ximported1', '0ximported2'];
const PRIVATE_KEYS: Record<string, string> = {
  '0ximported1': 'private-key-1',
  '0ximported2': 'private-key-2',
};

const mockNavigation = {
  setOptions: jest.fn(),
  setParams: jest.fn(),
  replace: jest.fn(),
  navigate: jest.fn(),
  push: jest.fn(),
};

const NO_PASSWORD_STATE = {
  ...initialState,
  user: { passwordSet: false, seedphraseBackedUp: true },
};
const PASSWORD_SET_STATE = {
  ...initialState,
  settings: { lockTime: 30000 },
};

const renderChoosePassword = (
  previousScreen?: string,
  state: typeof initialState = NO_PASSWORD_STATE,
) =>
  renderWithProvider(
    <ChoosePassword
      navigation={mockNavigation}
      route={{
        params: previousScreen ? { [PREVIOUS_SCREEN]: previousScreen } : {},
      }}
    />,
    { state },
    false,
  );

const fillFormAndSubmit = async (
  getByTestId: ReturnType<typeof renderChoosePassword>['getByTestId'],
  password = VALID_PASSWORD,
  confirmPassword = password,
) => {
  fireEvent.changeText(
    getByTestId(ChoosePasswordSelectorsIDs.NEW_PASSWORD_INPUT_ID),
    password,
  );
  fireEvent.changeText(
    getByTestId(ChoosePasswordSelectorsIDs.CONFIRM_PASSWORD_INPUT_ID),
    confirmPassword,
  );
  fireEvent.press(
    getByTestId(ChoosePasswordSelectorsIDs.ANDROID_I_UNDERSTAND_BUTTON_ID),
  );
  fireEvent.press(getByTestId(ChoosePasswordSelectorsIDs.SUBMIT_BUTTON_ID));
};

const getTrackedEvents = (): ITrackingEvent[] =>
  (trackOnboarding as jest.Mock).mock.calls.map(([event]) => event);

describe('ChoosePassword', () => {
  it('should render correctly', () => {
    const wrapper = shallow(
      <Provider store={store}>
        <ChoosePassword route={{ params: [ONBOARDING, PROTECT] }} />
      </Provider>,
    );
    expect(wrapper).toMatchSnapshot();
  });

  describe('onPressCreate', () => {
    const authType = { currentAuthType: 'password' };

    beforeEach(() => {
      jest.clearAllMocks();
      jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
      mockKeyringController.state.keyrings = [
        { type: 'HD Key Tree', accounts: HD_ACCOUNTS },
        { type: 'Simple Key Pair', accounts: [IMPORTED_ACCOUNTS[0]] },
        { type: 'Simple Key Pair', accounts: [IMPORTED_ACCOUNTS[1]] },
      ];
      mockKeyringController.exportSeedPhrase.mockResolvedValue(
        MOCK_SEED_PHRASE,
      );
      mockKeyringController.exportAccount.mockImplementation(
        async (_password: string, address: string) => PRIVATE_KEYS[address],
      );
      mockKeyringController.addNewAccount.mockResolvedValue(undefined);
      mockKeyringController.importAccountWithStrategy.mockResolvedValue(
        undefined,
      );
      mockAuthentication.getType.mockResolvedValue({
        currentAuthType: 'password',
        availableBiometryType: undefined,
      });
      mockAuthentication.componentAuthenticationType.mockResolvedValue(
        authType,
      );
      mockAuthentication.newWalletAndKeychain.mockResolvedValue(undefined);
      mockAuthentication.newWalletAndRestore.mockResolvedValue(undefined);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    describe('validation', () => {
      it('does not create a wallet when passwords do not match', async () => {
        const { getByTestId } = renderChoosePassword(ONBOARDING);

        await fillFormAndSubmit(getByTestId, VALID_PASSWORD, 'Different1!');

        fireEvent(
          getByTestId(ChoosePasswordSelectorsIDs.CONFIRM_PASSWORD_INPUT_ID),
          'submitEditing',
        );
        await waitFor(() =>
          expect(
            mockAuthentication.componentAuthenticationType,
          ).not.toHaveBeenCalled(),
        );
        expect(mockAuthentication.newWalletAndKeychain).not.toHaveBeenCalled();
        expect(mockAuthentication.newWalletAndRestore).not.toHaveBeenCalled();
        expect(Alert.alert).not.toHaveBeenCalled();
      });

      it('does not create a wallet when the terms checkbox is not selected', async () => {
        const { getByTestId } = renderChoosePassword(ONBOARDING);

        fireEvent.changeText(
          getByTestId(ChoosePasswordSelectorsIDs.NEW_PASSWORD_INPUT_ID),
          VALID_PASSWORD,
        );
        fireEvent.changeText(
          getByTestId(ChoosePasswordSelectorsIDs.CONFIRM_PASSWORD_INPUT_ID),
          VALID_PASSWORD,
        );
        fireEvent(
          getByTestId(ChoosePasswordSelectorsIDs.CONFIRM_PASSWORD_INPUT_ID),
          'submitEditing',
        );

        await waitFor(() =>
          expect(
            mockAuthentication.newWalletAndKeychain,
          ).not.toHaveBeenCalled(),
        );
        expect(Alert.alert).not.toHaveBeenCalled();
      });

      it('shows the password length error when the password is too short', async () => {
        const { getByTestId } = renderChoosePassword(ONBOARDING);

        await fillFormAndSubmit(getByTestId, 'short');

        await waitFor(() =>
          expect(Alert.alert).toHaveBeenCalledWith(
            'Error',
            strings('choose_password.password_length_error'),
          ),
        );
        expect(
          mockAuthentication.componentAuthenticationType,
        ).not.toHaveBeenCalled();
        expect(mockAuthentication.newWalletAndKeychain).not.toHaveBeenCalled();
        expect(getTrackedEvents()).toHaveLength(0);
      });
    });

    describe('when coming from onboarding', () => {
      it('creates a new wallet and keychain, then navigates to backup', async () => {
        const { getByTestId, store: reduxStore } =
          renderChoosePassword(ONBOARDING);

        await fillFormAndSubmit(getByTestId);

        await waitFor(() =>
          expect(mockNavigation.replace).toHaveBeenCalledWith(
            'AccountBackupStep1',
          ),
        );
        expect(mockAuthentication.newWalletAndKeychain).toHaveBeenCalledWith(
          VALID_PASSWORD,
          authType,
        );
        expect(mockAuthentication.newWalletAndRestore).not.toHaveBeenCalled();
        expect(mockKeyringController.exportSeedPhrase).not.toHaveBeenCalled();
        const state = reduxStore.getState();
        expect(state.user.passwordSet).toBe(true);
        expect(state.user.seedphraseBackedUp).toBe(false);
        expect(state.settings.lockTime).toBe(AppConstants.DEFAULT_LOCK_TIMEOUT);
        expect(getTrackedEvents().map((e) => e.name)).toEqual([
          MetaMetricsEvents.WALLET_CREATION_ATTEMPTED.category,
          MetaMetricsEvents.WALLET_CREATED.category,
          MetaMetricsEvents.WALLET_SETUP_COMPLETED.category,
        ]);
      });

      it('falls back to password-only auth when the biometric prompt is rejected', async () => {
        const passwordAuthType = {
          currentAuthType: 'password',
          availableBiometryType: null,
        };
        mockAuthentication.componentAuthenticationType
          .mockResolvedValueOnce({ currentAuthType: 'biometrics' })
          .mockResolvedValueOnce(passwordAuthType);
        mockAuthentication.newWalletAndKeychain
          .mockRejectedValueOnce(new Error('User rejected biometrics'))
          .mockResolvedValueOnce(undefined);
        const { getByTestId } = renderChoosePassword(ONBOARDING);

        await fillFormAndSubmit(getByTestId);

        await waitFor(() =>
          expect(mockNavigation.replace).toHaveBeenCalledWith(
            'AccountBackupStep1',
          ),
        );
        expect(
          mockAuthentication.componentAuthenticationType,
        ).toHaveBeenLastCalledWith(false, false);
        expect(mockAuthentication.newWalletAndKeychain).toHaveBeenCalledTimes(
          2,
        );
        expect(
          mockAuthentication.newWalletAndKeychain,
        ).toHaveBeenLastCalledWith(VALID_PASSWORD, passwordAuthType);
      });

      it('exports the seed phrase with the user password on fallback once the keyring password is set', async () => {
        mockNavigation.replace.mockImplementationOnce(() => {
          throw new Error('navigation failed');
        });
        const { getByTestId } = renderChoosePassword(ONBOARDING);

        await fillFormAndSubmit(getByTestId);

        await waitFor(() =>
          expect(mockAuthentication.newWalletAndRestore).toHaveBeenCalled(),
        );
        expect(mockKeyringController.exportSeedPhrase).toHaveBeenCalledWith(
          VALID_PASSWORD,
        );
        expect(mockKeyringController.exportAccount).toHaveBeenCalledWith(
          VALID_PASSWORD,
          IMPORTED_ACCOUNTS[0],
        );
        expect(mockAuthentication.newWalletAndRestore).toHaveBeenCalledWith(
          '',
          undefined,
          MOCK_SEED_PHRASE,
          true,
        );
      });
    });

    describe('recreateVault', () => {
      it('re-creates the vault from the exported seed, re-derives HD accounts and re-imports private keys', async () => {
        const { getByTestId, store: reduxStore } = renderChoosePassword();

        await fillFormAndSubmit(getByTestId);

        await waitFor(() =>
          expect(mockNavigation.replace).toHaveBeenCalledWith(
            'AccountBackupStep1',
          ),
        );
        expect(mockKeyringController.exportSeedPhrase).toHaveBeenCalledTimes(1);
        expect(mockKeyringController.exportSeedPhrase).toHaveBeenCalledWith('');
        expect(mockKeyringController.exportAccount).toHaveBeenCalledTimes(2);
        expect(mockKeyringController.exportAccount).toHaveBeenCalledWith(
          '',
          IMPORTED_ACCOUNTS[0],
        );
        expect(mockKeyringController.exportAccount).toHaveBeenCalledWith(
          '',
          IMPORTED_ACCOUNTS[1],
        );
        expect(mockAuthentication.newWalletAndKeychain).not.toHaveBeenCalled();
        expect(mockAuthentication.newWalletAndRestore).toHaveBeenCalledTimes(1);
        expect(mockAuthentication.newWalletAndRestore).toHaveBeenCalledWith(
          VALID_PASSWORD,
          authType,
          MOCK_SEED_PHRASE,
          true,
        );
        expect(mockKeyringController.addNewAccount).toHaveBeenCalledTimes(
          HD_ACCOUNTS.length - 1,
        );
        expect(
          mockKeyringController.importAccountWithStrategy,
        ).toHaveBeenCalledTimes(2);
        expect(
          mockKeyringController.importAccountWithStrategy,
        ).toHaveBeenNthCalledWith(1, 'privateKey', ['private-key-1']);
        expect(
          mockKeyringController.importAccountWithStrategy,
        ).toHaveBeenNthCalledWith(2, 'privateKey', ['private-key-2']);

        const restoreOrder =
          mockAuthentication.newWalletAndRestore.mock.invocationCallOrder[0];
        expect(
          mockKeyringController.exportAccount.mock.invocationCallOrder[0],
        ).toBeLessThan(restoreOrder);
        expect(
          mockKeyringController.addNewAccount.mock.invocationCallOrder[0],
        ).toBeGreaterThan(restoreOrder);
        expect(
          mockKeyringController.importAccountWithStrategy.mock
            .invocationCallOrder[0],
        ).toBeGreaterThan(restoreOrder);

        const state = reduxStore.getState();
        expect(state.user.passwordSet).toBe(true);
        expect(state.settings.lockTime).toBe(AppConstants.DEFAULT_LOCK_TIMEOUT);
      });

      it('does not add HD accounts when only one HD account exists', async () => {
        mockKeyringController.state.keyrings = [
          { type: 'HD Key Tree', accounts: ['0xhd1'] },
        ];
        const { getByTestId } = renderChoosePassword();

        await fillFormAndSubmit(getByTestId);

        await waitFor(() =>
          expect(mockNavigation.replace).toHaveBeenCalledWith(
            'AccountBackupStep1',
          ),
        );
        expect(mockKeyringController.addNewAccount).not.toHaveBeenCalled();
        expect(mockKeyringController.exportAccount).not.toHaveBeenCalled();
        expect(
          mockKeyringController.importAccountWithStrategy,
        ).not.toHaveBeenCalled();
      });

      // Known risk: imported accounts are silently dropped from the rebuilt
      // vault when exporting their private keys fails.
      it('still recreates the vault but drops imported accounts when exportAccount rejects', async () => {
        const exportError = new Error('export failed');
        mockKeyringController.exportAccount.mockRejectedValue(exportError);
        const { getByTestId } = renderChoosePassword();

        await fillFormAndSubmit(getByTestId);

        await waitFor(() =>
          expect(mockNavigation.replace).toHaveBeenCalledWith(
            'AccountBackupStep1',
          ),
        );
        expect(Logger.error).toHaveBeenCalledWith(
          exportError,
          'error while trying to get imported accounts on recreate vault',
        );
        expect(mockAuthentication.newWalletAndRestore).toHaveBeenCalledWith(
          VALID_PASSWORD,
          authType,
          MOCK_SEED_PHRASE,
          true,
        );
        expect(mockKeyringController.addNewAccount).toHaveBeenCalledTimes(
          HD_ACCOUNTS.length - 1,
        );
        expect(
          mockKeyringController.importAccountWithStrategy,
        ).not.toHaveBeenCalled();
        expect(getTrackedEvents().map((e) => e.name)).not.toContain(
          MetaMetricsEvents.WALLET_SETUP_FAILURE.category,
        );
      });

      it('logs and continues when re-importing a private key fails', async () => {
        const importError = new Error('import failed');
        mockKeyringController.importAccountWithStrategy.mockRejectedValueOnce(
          importError,
        );
        const { getByTestId } = renderChoosePassword();

        await fillFormAndSubmit(getByTestId);

        await waitFor(() =>
          expect(mockNavigation.replace).toHaveBeenCalledWith(
            'AccountBackupStep1',
          ),
        );
        expect(Logger.error).toHaveBeenCalledWith(
          importError,
          'error while trying to import accounts on recreate vault',
        );
        expect(
          mockKeyringController.importAccountWithStrategy,
        ).toHaveBeenCalledTimes(1);
      });
    });

    describe('error fallback', () => {
      it('shows the security alert and resets to an unprotected vault when the passcode is not set', async () => {
        mockAuthentication.newWalletAndRestore.mockRejectedValueOnce(
          new Error(PASSCODE_NOT_SET_ERROR_MESSAGE),
        );
        const {
          getByTestId,
          queryByText,
          store: reduxStore,
        } = renderChoosePassword(undefined, PASSWORD_SET_STATE);

        await fillFormAndSubmit(getByTestId);

        await waitFor(() =>
          expect(Alert.alert).toHaveBeenCalledWith(
            strings('choose_password.security_alert_title'),
            strings('choose_password.security_alert_message'),
          ),
        );
        expect(mockAuthentication.newWalletAndRestore).toHaveBeenCalledTimes(2);
        expect(mockAuthentication.newWalletAndRestore).toHaveBeenLastCalledWith(
          '',
          undefined,
          MOCK_SEED_PHRASE,
          true,
        );
        expect(mockKeyringController.exportSeedPhrase).toHaveBeenCalledTimes(2);
        expect(mockKeyringController.exportSeedPhrase).toHaveBeenLastCalledWith(
          '',
        );
        expect(StorageWrapper.setItem).toHaveBeenCalledWith(
          EXISTING_USER,
          TRUE,
        );
        expect(StorageWrapper.removeItem).toHaveBeenCalledWith(
          SEED_PHRASE_HINTS,
        );
        const state = reduxStore.getState();
        expect(state.user.passwordSet).toBe(false);
        expect(state.settings.lockTime).toBe(-1);
        expect(mockNavigation.replace).not.toHaveBeenCalled();
        expect(
          queryByText(`Error: ${PASSCODE_NOT_SET_ERROR_MESSAGE}`),
        ).toBeNull();
        expect(
          getByTestId(ChoosePasswordSelectorsIDs.SUBMIT_BUTTON_ID),
        ).toBeTruthy();
        const failureEvent = getTrackedEvents().find(
          (e) => e.name === MetaMetricsEvents.WALLET_SETUP_FAILURE.category,
        );
        expect(failureEvent?.properties).toEqual({
          wallet_setup_type: 'new',
          error_type: `Error: ${PASSCODE_NOT_SET_ERROR_MESSAGE}`,
        });
      });

      it('sets the error state and tracks WALLET_SETUP_FAILURE for a generic error', async () => {
        mockAuthentication.componentAuthenticationType.mockRejectedValueOnce(
          new Error('Something went wrong'),
        );
        const {
          getByTestId,
          findByText,
          store: reduxStore,
        } = renderChoosePassword(ONBOARDING, PASSWORD_SET_STATE);

        await fillFormAndSubmit(getByTestId);

        expect(await findByText('Error: Something went wrong')).toBeTruthy();
        expect(Alert.alert).not.toHaveBeenCalled();
        expect(mockAuthentication.newWalletAndKeychain).not.toHaveBeenCalled();
        expect(mockAuthentication.newWalletAndRestore).toHaveBeenCalledWith(
          '',
          undefined,
          MOCK_SEED_PHRASE,
          true,
        );
        expect(StorageWrapper.setItem).toHaveBeenCalledWith(
          EXISTING_USER,
          TRUE,
        );
        expect(StorageWrapper.removeItem).toHaveBeenCalledWith(
          SEED_PHRASE_HINTS,
        );
        const state = reduxStore.getState();
        expect(state.user.passwordSet).toBe(false);
        expect(state.settings.lockTime).toBe(-1);
        expect(getTrackedEvents().map((e) => e.name)).toEqual([
          MetaMetricsEvents.WALLET_CREATION_ATTEMPTED.category,
          MetaMetricsEvents.WALLET_SETUP_FAILURE.category,
        ]);
        expect(getTrackedEvents()[1].properties).toEqual({
          wallet_setup_type: 'new',
          error_type: 'Error: Something went wrong',
        });
      });

      it('logs and still resets app state when recreating the empty-password vault fails', async () => {
        const restoreError = new Error('restore failed');
        mockAuthentication.newWalletAndRestore.mockRejectedValue(restoreError);
        const {
          getByTestId,
          findByText,
          store: reduxStore,
        } = renderChoosePassword(undefined, PASSWORD_SET_STATE);

        await fillFormAndSubmit(getByTestId);

        expect(await findByText('Error: restore failed')).toBeTruthy();
        expect(mockAuthentication.newWalletAndRestore).toHaveBeenCalledTimes(2);
        expect(Logger.error).toHaveBeenCalledWith(restoreError);
        const state = reduxStore.getState();
        expect(state.user.passwordSet).toBe(false);
        expect(state.settings.lockTime).toBe(-1);
      });
    });
  });
});
