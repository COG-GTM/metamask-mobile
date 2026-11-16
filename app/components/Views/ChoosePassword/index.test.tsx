import React from 'react';
import { Alert } from 'react-native';
import { shallow } from 'enzyme';
import { act, fireEvent, waitFor } from '@testing-library/react-native';
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
import Authentication from '../../../core/Authentication';
import StorageWrapper from '../../../store/storage-wrapper';
import Logger from '../../../util/Logger';
import trackOnboarding from '../../../util/metrics/TrackOnboarding/trackOnboarding';
import { MetaMetricsEvents } from '../../../core/Analytics';
import AppConstants from '../../../core/AppConstants';
import AUTHENTICATION_TYPE from '../../../constants/userProperties';
import {
  EXISTING_USER,
  SEED_PHRASE_HINTS,
  TRUE,
} from '../../../constants/storage';

interface MockKeyring {
  type: string;
  accounts: string[];
}

const mockKeyringController = {
  state: { keyrings: [] as MockKeyring[] },
  exportSeedPhrase: jest.fn(),
  exportAccount: jest.fn(),
  addNewAccount: jest.fn(),
  importAccountWithStrategy: jest.fn(),
};

jest.mock('../../../core/Engine', () => ({
  __esModule: true,
  default: {
    get context() {
      return { KeyringController: mockKeyringController };
    },
  },
}));

jest.mock('../../../core/Authentication', () => ({
  __esModule: true,
  default: {
    getType: jest.fn(),
    componentAuthenticationType: jest.fn(),
    newWalletAndKeychain: jest.fn(),
    newWalletAndRestore: jest.fn(),
  },
}));

jest.mock('../../../store/storage-wrapper', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('../../../util/Logger', () => ({
  error: jest.fn(),
  log: jest.fn(),
}));

jest.mock('../../../util/metrics/TrackOnboarding/trackOnboarding', () =>
  jest.fn(),
);

jest.mock('../../../util/termsOfUse/termsOfUse', () => jest.fn());

// The step indicator animation reschedules itself forever under jest
jest.mock('../../UI/OnboardingProgress', () => () => null);

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

const VALID_PASSWORD = 'Str0ngPassw0rd!';
const SEED_PHRASE =
  'test test test test test test test test test test test junk';
const AUTH_DATA = {
  currentAuthType: AUTHENTICATION_TYPE.PASSWORD,
  availableBiometryType: undefined,
};
const PASSCODE_NOT_SET_ERROR = 'Error: Passcode not set.';
const INITIAL_LOCK_TIME = 30000;

const hdKeyring = (count: number): MockKeyring => ({
  type: 'HD Key Tree',
  accounts: Array.from({ length: count }, (_, i) => `0xhd${i}`),
});
const simpleKeyring = (...accounts: string[]): MockKeyring => ({
  type: 'Simple Key Pair',
  accounts,
});

const mockNavigation = {
  setOptions: jest.fn(),
  setParams: jest.fn(),
  replace: jest.fn(),
  navigate: jest.fn(),
  push: jest.fn(),
};

const renderChoosePassword = (previousScreen?: string) =>
  renderWithProvider(
    <ChoosePassword
      navigation={mockNavigation}
      route={{
        params: previousScreen ? { [PREVIOUS_SCREEN]: previousScreen } : {},
      }}
    />,
    {
      state: {
        user: { passwordSet: true, seedphraseBackedUp: false },
        settings: { lockTime: INITIAL_LOCK_TIME },
      },
    },
  );

type RenderResult = ReturnType<typeof renderChoosePassword>;

const fillForm = (
  { getByTestId }: RenderResult,
  password: string,
  confirmPassword: string = password,
  acceptTerms = true,
) => {
  fireEvent.changeText(
    getByTestId(ChoosePasswordSelectorsIDs.NEW_PASSWORD_INPUT_ID),
    password,
  );
  fireEvent.changeText(
    getByTestId(ChoosePasswordSelectorsIDs.CONFIRM_PASSWORD_INPUT_ID),
    confirmPassword,
  );
  if (acceptTerms) {
    fireEvent.press(
      getByTestId(ChoosePasswordSelectorsIDs.ANDROID_I_UNDERSTAND_BUTTON_ID),
    );
  }
};

const submit = async ({ getByTestId }: RenderResult) => {
  await act(async () => {
    fireEvent(
      getByTestId(ChoosePasswordSelectorsIDs.CONFIRM_PASSWORD_INPUT_ID),
      'submitEditing',
    );
  });
};

const trackedEvent = (name: string) =>
  (trackOnboarding as jest.Mock).mock.calls
    .map(([event]) => event)
    .find((event) => event.name === name);

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
    let alertSpy: jest.SpyInstance;

    beforeEach(() => {
      jest.clearAllMocks();
      alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
      mockKeyringController.state.keyrings = [hdKeyring(1)];
      mockKeyringController.exportSeedPhrase.mockResolvedValue(SEED_PHRASE);
      mockKeyringController.exportAccount.mockImplementation(
        async (_password: string, address: string) => `pk-${address}`,
      );
      mockKeyringController.addNewAccount.mockResolvedValue(undefined);
      mockKeyringController.importAccountWithStrategy.mockResolvedValue(
        undefined,
      );
      (Authentication.getType as jest.Mock).mockResolvedValue(AUTH_DATA);
      (
        Authentication.componentAuthenticationType as jest.Mock
      ).mockResolvedValue(AUTH_DATA);
      (Authentication.newWalletAndKeychain as jest.Mock).mockResolvedValue(
        undefined,
      );
      (Authentication.newWalletAndRestore as jest.Mock).mockResolvedValue(
        undefined,
      );
      (StorageWrapper.getItem as jest.Mock).mockResolvedValue(null);
      (StorageWrapper.setItem as jest.Mock).mockResolvedValue(undefined);
      (StorageWrapper.removeItem as jest.Mock).mockResolvedValue(undefined);
    });

    afterEach(() => {
      alertSpy.mockRestore();
    });

    describe('validation', () => {
      it('shows the length error and creates nothing when the password is too short', async () => {
        const screen = renderChoosePassword(ONBOARDING);
        fillForm(screen, 'short');

        await submit(screen);

        expect(alertSpy).toHaveBeenCalledWith(
          'Error',
          strings('choose_password.password_length_error'),
        );
        expect(
          Authentication.componentAuthenticationType,
        ).not.toHaveBeenCalled();
        expect(Authentication.newWalletAndKeychain).not.toHaveBeenCalled();
        expect(mockKeyringController.exportSeedPhrase).not.toHaveBeenCalled();
      });

      it('does nothing when the passwords do not match', async () => {
        const screen = renderChoosePassword(ONBOARDING);
        fillForm(screen, VALID_PASSWORD, `${VALID_PASSWORD}x`);

        await submit(screen);

        // The canSubmit guard returns before the password_dont_match alert,
        // so mismatching passwords are rejected silently.
        expect(alertSpy).not.toHaveBeenCalled();
        expect(
          Authentication.componentAuthenticationType,
        ).not.toHaveBeenCalled();
        expect(Authentication.newWalletAndKeychain).not.toHaveBeenCalled();
        expect(Authentication.newWalletAndRestore).not.toHaveBeenCalled();
      });

      it('does nothing when the terms checkbox is not selected', async () => {
        const screen = renderChoosePassword(ONBOARDING);
        fillForm(screen, VALID_PASSWORD, VALID_PASSWORD, false);

        await submit(screen);

        expect(alertSpy).not.toHaveBeenCalled();
        expect(Authentication.newWalletAndKeychain).not.toHaveBeenCalled();
      });
    });

    describe('new wallet from onboarding', () => {
      it('creates the wallet, sets the password and navigates to backup', async () => {
        const screen = renderChoosePassword(ONBOARDING);
        fillForm(screen, VALID_PASSWORD);

        await submit(screen);

        expect(Authentication.newWalletAndKeychain).toHaveBeenCalledTimes(1);
        expect(Authentication.newWalletAndKeychain).toHaveBeenCalledWith(
          VALID_PASSWORD,
          AUTH_DATA,
        );
        expect(Authentication.newWalletAndRestore).not.toHaveBeenCalled();
        expect(mockKeyringController.exportSeedPhrase).not.toHaveBeenCalled();
        expect(screen.store.getState().user.passwordSet).toBe(true);
        expect(screen.store.getState().user.seedphraseBackedUp).toBe(false);
        expect(screen.store.getState().settings.lockTime).toBe(
          AppConstants.DEFAULT_LOCK_TIMEOUT,
        );
        expect(mockNavigation.replace).toHaveBeenCalledWith(
          'AccountBackupStep1',
        );
        expect(
          trackedEvent(MetaMetricsEvents.WALLET_SETUP_COMPLETED.category),
        ).toBeDefined();
      });

      it('retries with password-only auth when newWalletAndKeychain rejects', async () => {
        const passwordOnly = {
          currentAuthType: AUTHENTICATION_TYPE.PASSWORD,
          availableBiometryType: 'FaceID',
        };
        (Authentication.componentAuthenticationType as jest.Mock)
          .mockResolvedValueOnce({
            currentAuthType: AUTHENTICATION_TYPE.BIOMETRIC,
            availableBiometryType: 'FaceID',
          })
          .mockResolvedValueOnce(passwordOnly);
        (Authentication.newWalletAndKeychain as jest.Mock)
          .mockRejectedValueOnce(new Error('User canceled the operation.'))
          .mockResolvedValueOnce(undefined);
        const screen = renderChoosePassword(ONBOARDING);
        fillForm(screen, VALID_PASSWORD);

        await submit(screen);

        expect(
          Authentication.componentAuthenticationType,
        ).toHaveBeenLastCalledWith(false, false);
        expect(Authentication.newWalletAndKeychain).toHaveBeenCalledTimes(2);
        expect(Authentication.newWalletAndKeychain).toHaveBeenLastCalledWith(
          VALID_PASSWORD,
          passwordOnly,
        );
        expect(mockNavigation.replace).toHaveBeenCalledWith(
          'AccountBackupStep1',
        );
        expect(Authentication.newWalletAndRestore).not.toHaveBeenCalled();
      });
    });

    describe('recreateVault (not coming from onboarding)', () => {
      it('restores the exported seed, re-derives n-1 HD accounts and re-imports every private key', async () => {
        mockKeyringController.state.keyrings = [
          hdKeyring(3),
          simpleKeyring('0xaaa'),
          simpleKeyring('0xbbb'),
        ];
        const screen = renderChoosePassword(PROTECT);
        fillForm(screen, VALID_PASSWORD);

        await submit(screen);

        // keyringControllerPasswordSet starts false, so the empty password is used
        expect(mockKeyringController.exportSeedPhrase).toHaveBeenCalledWith('');
        expect(mockKeyringController.exportAccount).toHaveBeenCalledTimes(2);
        expect(mockKeyringController.exportAccount).toHaveBeenCalledWith(
          '',
          '0xaaa',
        );
        expect(mockKeyringController.exportAccount).toHaveBeenCalledWith(
          '',
          '0xbbb',
        );
        expect(Authentication.newWalletAndRestore).toHaveBeenCalledTimes(1);
        expect(Authentication.newWalletAndRestore).toHaveBeenCalledWith(
          VALID_PASSWORD,
          AUTH_DATA,
          SEED_PHRASE,
          true,
        );
        expect(mockKeyringController.addNewAccount).toHaveBeenCalledTimes(2);
        expect(
          mockKeyringController.importAccountWithStrategy,
        ).toHaveBeenCalledTimes(2);
        expect(
          mockKeyringController.importAccountWithStrategy,
        ).toHaveBeenNthCalledWith(1, 'privateKey', ['pk-0xaaa']);
        expect(
          mockKeyringController.importAccountWithStrategy,
        ).toHaveBeenNthCalledWith(2, 'privateKey', ['pk-0xbbb']);
        expect(Authentication.newWalletAndKeychain).not.toHaveBeenCalled();
        expect(screen.store.getState().user.passwordSet).toBe(true);
        expect(mockNavigation.replace).toHaveBeenCalledWith(
          'AccountBackupStep1',
        );
      });

      it('exports imported keys before the vault is rebuilt and imports them after', async () => {
        mockKeyringController.state.keyrings = [
          hdKeyring(1),
          simpleKeyring('0xaaa'),
        ];
        const order: string[] = [];
        mockKeyringController.exportSeedPhrase.mockImplementation(async () => {
          order.push('exportSeedPhrase');
          return SEED_PHRASE;
        });
        mockKeyringController.exportAccount.mockImplementation(async () => {
          order.push('exportAccount');
          return 'pk';
        });
        (Authentication.newWalletAndRestore as jest.Mock).mockImplementation(
          async () => {
            order.push('newWalletAndRestore');
          },
        );
        mockKeyringController.importAccountWithStrategy.mockImplementation(
          async () => {
            order.push('importAccountWithStrategy');
          },
        );
        const screen = renderChoosePassword(PROTECT);
        fillForm(screen, VALID_PASSWORD);

        await submit(screen);

        expect(order).toEqual([
          'exportSeedPhrase',
          'exportAccount',
          'newWalletAndRestore',
          'importAccountWithStrategy',
        ]);
        expect(mockKeyringController.addNewAccount).not.toHaveBeenCalled();
      });

      it('reads the HD account count after the vault is rebuilt', async () => {
        // Known risk: the count comes from KeyringController.state after
        // newWalletAndRestore. If the rebuilt vault only holds the first
        // account, the previous HD accounts are not re-derived.
        mockKeyringController.state.keyrings = [hdKeyring(3)];
        (Authentication.newWalletAndRestore as jest.Mock).mockImplementation(
          async () => {
            mockKeyringController.state.keyrings = [hdKeyring(1)];
          },
        );
        const screen = renderChoosePassword(PROTECT);
        fillForm(screen, VALID_PASSWORD);

        await submit(screen);

        expect(Authentication.newWalletAndRestore).toHaveBeenCalledTimes(1);
        expect(mockKeyringController.addNewAccount).not.toHaveBeenCalled();
      });

      it('still rebuilds the vault but drops imported accounts when exportAccount rejects', async () => {
        // Known risk: the export failure is logged and swallowed, so the
        // imported accounts are silently lost from the rebuilt vault.
        mockKeyringController.state.keyrings = [
          hdKeyring(2),
          simpleKeyring('0xaaa', '0xbbb'),
        ];
        const exportError = new Error('export failed');
        mockKeyringController.exportAccount.mockRejectedValue(exportError);
        const screen = renderChoosePassword(PROTECT);
        fillForm(screen, VALID_PASSWORD);

        await submit(screen);

        expect(Logger.error).toHaveBeenCalledWith(
          exportError,
          'error while trying to get imported accounts on recreate vault',
        );
        expect(Authentication.newWalletAndRestore).toHaveBeenCalledWith(
          VALID_PASSWORD,
          AUTH_DATA,
          SEED_PHRASE,
          true,
        );
        expect(mockKeyringController.addNewAccount).toHaveBeenCalledTimes(1);
        expect(
          mockKeyringController.importAccountWithStrategy,
        ).not.toHaveBeenCalled();
        expect(screen.store.getState().user.passwordSet).toBe(true);
        expect(mockNavigation.replace).toHaveBeenCalledWith(
          'AccountBackupStep1',
        );
      });

      it('logs and continues when re-importing a private key fails', async () => {
        mockKeyringController.state.keyrings = [
          hdKeyring(1),
          simpleKeyring('0xaaa', '0xbbb'),
        ];
        const importError = new Error('import failed');
        mockKeyringController.importAccountWithStrategy.mockRejectedValueOnce(
          importError,
        );
        const screen = renderChoosePassword(PROTECT);
        fillForm(screen, VALID_PASSWORD);

        await submit(screen);

        expect(Logger.error).toHaveBeenCalledWith(
          importError,
          'error while trying to import accounts on recreate vault',
        );
        // The loop stops at the first failure, so the second key is not imported
        expect(
          mockKeyringController.importAccountWithStrategy,
        ).toHaveBeenCalledTimes(1);
        expect(mockNavigation.replace).toHaveBeenCalledWith(
          'AccountBackupStep1',
        );
      });

      it('uses the user password for exports once the keyring password is set', async () => {
        mockKeyringController.state.keyrings = [
          hdKeyring(1),
          simpleKeyring('0xaaa'),
        ];
        // The first recreateVault sets keyringControllerPasswordSet; a later
        // failure makes the fallback export with the user's password.
        mockNavigation.replace.mockImplementationOnce(() => {
          throw new Error('navigation failed');
        });
        const screen = renderChoosePassword(PROTECT);
        fillForm(screen, VALID_PASSWORD);

        await submit(screen);

        expect(Authentication.newWalletAndRestore).toHaveBeenCalledTimes(2);
        expect(mockKeyringController.exportSeedPhrase).toHaveBeenNthCalledWith(
          1,
          '',
        );
        expect(mockKeyringController.exportSeedPhrase).toHaveBeenNthCalledWith(
          2,
          VALID_PASSWORD,
        );
        expect(mockKeyringController.exportAccount).toHaveBeenNthCalledWith(
          2,
          VALID_PASSWORD,
          '0xaaa',
        );
        expect(Authentication.newWalletAndRestore).toHaveBeenLastCalledWith(
          '',
          undefined,
          SEED_PHRASE,
          true,
        );
        expect(screen.store.getState().user.passwordSet).toBe(false);
      });
    });

    describe('error fallback', () => {
      it('recreates an empty-password vault, unsets the password and shows the security alert on PASSCODE_NOT_SET_ERROR', async () => {
        (
          Authentication.componentAuthenticationType as jest.Mock
        ).mockRejectedValueOnce(new Error('Passcode not set.'));
        const screen = renderChoosePassword(ONBOARDING);
        fillForm(screen, VALID_PASSWORD);

        await submit(screen);

        expect(Authentication.newWalletAndKeychain).not.toHaveBeenCalled();
        expect(mockKeyringController.exportSeedPhrase).toHaveBeenCalledWith('');
        expect(Authentication.newWalletAndRestore).toHaveBeenCalledTimes(1);
        expect(Authentication.newWalletAndRestore).toHaveBeenCalledWith(
          '',
          undefined,
          SEED_PHRASE,
          true,
        );
        expect(StorageWrapper.setItem).toHaveBeenCalledWith(
          EXISTING_USER,
          TRUE,
        );
        expect(StorageWrapper.removeItem).toHaveBeenCalledWith(
          SEED_PHRASE_HINTS,
        );
        expect(screen.store.getState().user.passwordSet).toBe(false);
        expect(screen.store.getState().settings.lockTime).toBe(-1);
        expect(alertSpy).toHaveBeenCalledWith(
          strings('choose_password.security_alert_title'),
          strings('choose_password.security_alert_message'),
        );
        expect(mockNavigation.replace).not.toHaveBeenCalled();
        expect(
          screen.queryByText(PASSCODE_NOT_SET_ERROR),
        ).not.toBeOnTheScreen();
        expect(
          trackedEvent(MetaMetricsEvents.WALLET_SETUP_FAILURE.category)
            ?.properties,
        ).toEqual({
          wallet_setup_type: 'new',
          error_type: PASSCODE_NOT_SET_ERROR,
        });
      });

      it('shows the security alert when the vault restore throws PASSCODE_NOT_SET_ERROR', async () => {
        (Authentication.newWalletAndRestore as jest.Mock)
          .mockRejectedValueOnce(new Error('Passcode not set.'))
          .mockResolvedValueOnce(undefined);
        const screen = renderChoosePassword(PROTECT);
        fillForm(screen, VALID_PASSWORD);

        await submit(screen);

        expect(Authentication.newWalletAndRestore).toHaveBeenCalledTimes(2);
        expect(Authentication.newWalletAndRestore).toHaveBeenLastCalledWith(
          '',
          undefined,
          SEED_PHRASE,
          true,
        );
        expect(screen.store.getState().user.passwordSet).toBe(false);
        expect(screen.store.getState().settings.lockTime).toBe(-1);
        expect(alertSpy).toHaveBeenCalledWith(
          strings('choose_password.security_alert_title'),
          strings('choose_password.security_alert_message'),
        );
      });

      it('sets the error state and tracks WALLET_SETUP_FAILURE on a generic error', async () => {
        const passwordOnly = {
          currentAuthType: AUTHENTICATION_TYPE.PASSWORD,
          availableBiometryType: undefined,
        };
        (Authentication.componentAuthenticationType as jest.Mock)
          .mockResolvedValueOnce(AUTH_DATA)
          .mockResolvedValueOnce(passwordOnly);
        (Authentication.newWalletAndKeychain as jest.Mock).mockRejectedValue(
          new Error('keychain failure'),
        );
        const expectedError = `Error: ${strings(
          'choose_password.disable_biometric_error',
        )}`;
        const screen = renderChoosePassword(ONBOARDING);
        fillForm(screen, VALID_PASSWORD);

        await submit(screen);

        expect(Authentication.newWalletAndKeychain).toHaveBeenCalledTimes(2);
        expect(Authentication.newWalletAndRestore).toHaveBeenCalledWith(
          '',
          undefined,
          SEED_PHRASE,
          true,
        );
        expect(screen.store.getState().user.passwordSet).toBe(false);
        expect(screen.store.getState().settings.lockTime).toBe(-1);
        expect(alertSpy).not.toHaveBeenCalled();
        expect(mockNavigation.replace).not.toHaveBeenCalled();
        await waitFor(() =>
          expect(screen.getByText(expectedError)).toBeOnTheScreen(),
        );
        expect(
          trackedEvent(MetaMetricsEvents.WALLET_SETUP_FAILURE.category)
            ?.properties,
        ).toEqual({ wallet_setup_type: 'new', error_type: expectedError });
      });

      it('still unsets the password when the empty-password vault cannot be recreated', async () => {
        const restoreError = new Error('restore failed');
        (
          Authentication.componentAuthenticationType as jest.Mock
        ).mockRejectedValueOnce(new Error('auth type failed'));
        (Authentication.newWalletAndRestore as jest.Mock).mockRejectedValueOnce(
          restoreError,
        );
        const screen = renderChoosePassword(ONBOARDING);
        fillForm(screen, VALID_PASSWORD);

        await submit(screen);

        expect(Logger.error).toHaveBeenCalledWith(restoreError);
        expect(StorageWrapper.setItem).toHaveBeenCalledWith(
          EXISTING_USER,
          TRUE,
        );
        expect(screen.store.getState().user.passwordSet).toBe(false);
        expect(screen.store.getState().settings.lockTime).toBe(-1);
        await waitFor(() =>
          expect(screen.getByText('Error: auth type failed')).toBeOnTheScreen(),
        );
      });
    });
  });
});
