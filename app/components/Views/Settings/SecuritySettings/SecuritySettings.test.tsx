import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, waitFor } from '@testing-library/react-native';
import renderWithProvider from '../../../../util/test/renderWithProvider';

import SecuritySettings from './SecuritySettings';
import { backgroundState } from '../../../../util/test/initial-root-state';
import { AUTO_LOCK_SECTION } from './Sections/AutoLock/constants';
import {
  CLEAR_BROWSER_HISTORY_SECTION,
  CLEAR_PRIVACY_SECTION,
  DELETE_METRICS_BUTTON,
  LOGIN_OPTIONS,
  META_METRICS_DATA_MARKETING_SECTION,
  META_METRICS_SECTION,
  REVEAL_PRIVATE_KEY_SECTION,
  SDK_SECTION,
  SECURITY_SETTINGS_DELETE_WALLET_BUTTON,
  TURN_ON_REMEMBER_ME,
} from './SecuritySettings.constants';
import { SecurityPrivacyViewSelectorsIDs } from '../../../../../e2e/selectors/Settings/SecurityAndPrivacy/SecurityPrivacyView.selectors';
import SECURITY_ALERTS_TOGGLE_TEST_ID from './constants';
import { MOCK_ACCOUNTS_CONTROLLER_STATE } from '../../../../util/test/accountsControllerTestUtils';
import { Authentication } from '../../../../core';
import Engine from '../../../../core/Engine';
import AppConstants from '../../../../core/AppConstants';
import StorageWrapper from '../../../../store/storage-wrapper';
import Logger from '../../../../util/Logger';
import trackErrorAsAnalytics from '../../../../util/metrics/TrackError/trackErrorAsAnalytics';
import AUTHENTICATION_TYPE from '../../../../constants/userProperties';
import {
  BIOMETRY_CHOICE_DISABLED,
  EXISTING_USER,
  PASSCODE_DISABLED,
  TRUE,
} from '../../../../constants/storage';
import { SECURITY_PRIVACY_VIEW_ID } from '../../../../../wdio/screen-objects/testIDs/Screens/SecurityPrivacy.testIds';
import { strings } from '../../../../../locales/i18n';

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
    allowLoginWithRememberMe: true,
  },
};

const mockSetOptions = jest.fn();
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actualReactNavigation = jest.requireActual('@react-navigation/native');
  return {
    ...actualReactNavigation,
    useNavigation: () => ({
      navigate: mockNavigate,
      setOptions: mockSetOptions,
      goBack: mockGoBack,
    }),
    useFocusEffect: jest.fn(),
  };
});

jest.mock('@react-native-cookies/cookies', () => ({
  clearAll: jest.fn(),
  getAll: jest.fn().mockResolvedValue({}),
}));

let mockUseParamsValues: {
  scrollToDetectNFTs?: boolean;
} = {
  scrollToDetectNFTs: undefined,
};

jest.mock('../../../../util/Logger', () => ({
  error: jest.fn(),
  log: jest.fn(),
}));

jest.mock('../../../../util/metrics/TrackError/trackErrorAsAnalytics', () =>
  jest.fn(),
);

jest.mock('../../../../util/navigation/navUtils', () => ({
  ...jest.requireActual('../../../../util/navigation/navUtils'),
  useParams: jest.fn(() => mockUseParamsValues),
}));

describe('SecuritySettings', () => {
  beforeEach(() => {
    mockUseParamsValues = {
      scrollToDetectNFTs: undefined,
    };
  });
  it('should render correctly', () => {
    const wrapper = renderWithProvider(<SecuritySettings />, {
      state: initialState,
    });
    expect(wrapper.toJSON()).toMatchSnapshot();
  });
  it('should render all sections', () => {
    const { getByText, getByTestId } = renderWithProvider(
      <SecuritySettings />,
      {
        state: initialState,
      },
    );
    expect(getByText('Protect your wallet')).toBeTruthy();
    expect(
      getByTestId(SecurityPrivacyViewSelectorsIDs.CHANGE_PASSWORD_CONTAINER),
    ).toBeTruthy();
    expect(getByTestId(AUTO_LOCK_SECTION)).toBeTruthy();
    expect(getByTestId(LOGIN_OPTIONS)).toBeTruthy();
    expect(getByTestId(TURN_ON_REMEMBER_ME)).toBeTruthy();
    expect(getByTestId(REVEAL_PRIVATE_KEY_SECTION)).toBeTruthy();
    expect(getByTestId(SDK_SECTION)).toBeTruthy();
    expect(getByTestId(CLEAR_PRIVACY_SECTION)).toBeTruthy();
    expect(getByTestId(CLEAR_BROWSER_HISTORY_SECTION)).toBeTruthy();
    expect(getByTestId(META_METRICS_SECTION)).toBeTruthy();
    expect(getByTestId(DELETE_METRICS_BUTTON)).toBeTruthy();
    expect(getByTestId(META_METRICS_DATA_MARKETING_SECTION)).toBeTruthy();
    expect(getByTestId(SECURITY_SETTINGS_DELETE_WALLET_BUTTON)).toBeTruthy();
    expect(getByText('Automatic security checks')).toBeTruthy();
  });

  it('renders Blockaid settings', async () => {
    const { getByTestId, findByText } = renderWithProvider(
      <SecuritySettings />,
      {
        state: initialState,
      },
    );

    expect(await findByText('Security alerts')).toBeDefined();
    const toggle = getByTestId(SECURITY_ALERTS_TOGGLE_TEST_ID);
    expect(toggle).toBeDefined();
    expect(toggle.props.value).toBe(true);
  });
});

describe('SecuritySettings login options credential flow', () => {
  const PASSWORD = 'correct-horse-battery-staple';
  const mockExportSeedPhrase = jest.fn();
  let storedItems: Record<string, string | undefined>;

  const renderSettings = ({ lockTime = 1000 }: { lockTime?: number } = {}) =>
    renderWithProvider(<SecuritySettings />, {
      state: {
        ...initialState,
        settings: { ...initialState.settings, lockTime },
        user: { passwordSet: false },
      },
    });

  const toggle = async (
    getByTestId: ReturnType<typeof renderSettings>['getByTestId'],
    testId: string,
    value: boolean,
  ) => {
    await act(async () => {
      fireEvent(getByTestId(testId), 'onValueChange', value);
    });
  };

  const setItemCalls = () =>
    (StorageWrapper.setItem as jest.Mock).mock.calls.map(([key]) => key);

  beforeEach(() => {
    mockUseParamsValues = { scrollToDetectNFTs: undefined };
    storedItems = {};
    jest.clearAllMocks();
    (StorageWrapper.getItem as jest.Mock).mockImplementation(
      async (key: string) => storedItems[key],
    );
    (StorageWrapper.setItem as jest.Mock).mockResolvedValue(undefined);
    mockExportSeedPhrase.mockReset().mockResolvedValue([]);
    (
      Engine.context.KeyringController as unknown as {
        exportSeedPhrase: jest.Mock;
      }
    ).exportSeedPhrase = mockExportSeedPhrase;
    jest.spyOn(Authentication, 'getType').mockResolvedValue({
      currentAuthType: AUTHENTICATION_TYPE.BIOMETRIC,
      availableBiometryType: 'FaceID' as never,
    });
    jest
      .spyOn(Authentication, 'getPassword')
      .mockResolvedValue({ password: PASSWORD } as never);
    jest.spyOn(Authentication, 'resetPassword').mockResolvedValue(undefined);
    jest.spyOn(Authentication, 'storePassword').mockResolvedValue(undefined);
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
  });

  afterEach(() => {
    (StorageWrapper.getItem as jest.Mock).mockReset();
    (StorageWrapper.setItem as jest.Mock).mockReset();
  });

  it('enables biometrics with stored credentials and stores the password as BIOMETRIC', async () => {
    storedItems[BIOMETRY_CHOICE_DISABLED] = TRUE;
    const { findByTestId, getByTestId, store } = renderSettings();
    expect(
      (await findByTestId(SecurityPrivacyViewSelectorsIDs.BIOMETRICS_TOGGLE))
        .props.value,
    ).toBe(false);

    await toggle(
      getByTestId,
      SecurityPrivacyViewSelectorsIDs.BIOMETRICS_TOGGLE,
      true,
    );

    await waitFor(() =>
      expect(Authentication.storePassword).toHaveBeenCalledWith(
        PASSWORD,
        AUTHENTICATION_TYPE.BIOMETRIC,
      ),
    );
    expect(Authentication.resetPassword).toHaveBeenCalledTimes(1);
    expect(mockExportSeedPhrase).toHaveBeenCalledWith(PASSWORD);
    expect(StorageWrapper.setItem).toHaveBeenCalledWith(EXISTING_USER, TRUE);
    expect(setItemCalls()).not.toContain(BIOMETRY_CHOICE_DISABLED);
    expect(setItemCalls()).not.toContain(PASSCODE_DISABLED);
    await waitFor(() => expect(store.getState().user.passwordSet).toBe(true));
    expect(store.getState().settings.lockTime).toBe(1000);
    expect(await findByTestId(SECURITY_PRIVACY_VIEW_ID)).toBeTruthy();
  });

  it('enables device passcode with stored credentials and stores the password as PASSCODE', async () => {
    storedItems[BIOMETRY_CHOICE_DISABLED] = TRUE;
    storedItems[PASSCODE_DISABLED] = TRUE;
    const { findByTestId, getByTestId, store } = renderSettings();
    expect(
      (
        await findByTestId(
          SecurityPrivacyViewSelectorsIDs.DEVICE_PASSCODE_TOGGLE,
        )
      ).props.value,
    ).toBe(false);

    await toggle(
      getByTestId,
      SecurityPrivacyViewSelectorsIDs.DEVICE_PASSCODE_TOGGLE,
      true,
    );

    await waitFor(() =>
      expect(Authentication.storePassword).toHaveBeenCalledWith(
        PASSWORD,
        AUTHENTICATION_TYPE.PASSCODE,
      ),
    );
    expect(mockExportSeedPhrase).toHaveBeenCalledWith(PASSWORD);
    await waitFor(() => expect(store.getState().user.passwordSet).toBe(true));
  });

  it('disabling biometrics writes BIOMETRY_CHOICE_DISABLED and PASSCODE_DISABLED without storing the password', async () => {
    const { findByTestId, getByTestId, store } = renderSettings();
    expect(
      (await findByTestId(SecurityPrivacyViewSelectorsIDs.BIOMETRICS_TOGGLE))
        .props.value,
    ).toBe(true);

    await toggle(
      getByTestId,
      SecurityPrivacyViewSelectorsIDs.BIOMETRICS_TOGGLE,
      false,
    );

    await waitFor(() =>
      expect(StorageWrapper.setItem).toHaveBeenCalledWith(
        PASSCODE_DISABLED,
        TRUE,
      ),
    );
    expect(Authentication.resetPassword).toHaveBeenCalledTimes(1);
    expect(mockExportSeedPhrase).toHaveBeenCalledWith(PASSWORD);
    expect(StorageWrapper.setItem).toHaveBeenCalledWith(
      BIOMETRY_CHOICE_DISABLED,
      TRUE,
    );
    expect(Authentication.storePassword).not.toHaveBeenCalled();
    expect(store.getState().user.passwordSet).toBe(false);
    expect(await findByTestId(SECURITY_PRIVACY_VIEW_ID)).toBeTruthy();
  });

  it('disabling device passcode writes only PASSCODE_DISABLED', async () => {
    storedItems[BIOMETRY_CHOICE_DISABLED] = TRUE;
    const { findByTestId, getByTestId } = renderSettings();
    expect(
      (
        await findByTestId(
          SecurityPrivacyViewSelectorsIDs.DEVICE_PASSCODE_TOGGLE,
        )
      ).props.value,
    ).toBe(true);

    await toggle(
      getByTestId,
      SecurityPrivacyViewSelectorsIDs.DEVICE_PASSCODE_TOGGLE,
      false,
    );

    await waitFor(() =>
      expect(StorageWrapper.setItem).toHaveBeenCalledWith(
        PASSCODE_DISABLED,
        TRUE,
      ),
    );
    expect(setItemCalls()).not.toContain(BIOMETRY_CHOICE_DISABLED);
    expect(Authentication.storePassword).not.toHaveBeenCalled();
  });

  it.each([
    ['getPassword resolves null', () => Promise.resolve(null)],
    [
      'getPassword returns an empty password',
      () => Promise.resolve({ password: '' }),
    ],
    ['getPassword rejects', () => Promise.reject(new Error('keychain'))],
  ])(
    'navigates to EnterPasswordSimple when %s and stores credentials from onPasswordSet',
    async (_label, getPasswordImpl) => {
      jest
        .spyOn(Authentication, 'getPassword')
        .mockImplementation(getPasswordImpl as never);
      storedItems[BIOMETRY_CHOICE_DISABLED] = TRUE;
      const { findByTestId, getByTestId, store } = renderSettings();
      await findByTestId(SecurityPrivacyViewSelectorsIDs.BIOMETRICS_TOGGLE);

      await toggle(
        getByTestId,
        SecurityPrivacyViewSelectorsIDs.BIOMETRICS_TOGGLE,
        true,
      );

      await waitFor(() =>
        expect(mockNavigate).toHaveBeenCalledWith('EnterPasswordSimple', {
          onPasswordSet: expect.any(Function),
        }),
      );
      expect(Authentication.resetPassword).not.toHaveBeenCalled();
      expect(Authentication.storePassword).not.toHaveBeenCalled();
      expect(await findByTestId(SECURITY_PRIVACY_VIEW_ID)).toBeTruthy();

      const { onPasswordSet } = mockNavigate.mock.calls.find(
        ([route]) => route === 'EnterPasswordSimple',
      )[1];
      await act(async () => {
        onPasswordSet('typed-password');
      });

      await waitFor(() =>
        expect(Authentication.storePassword).toHaveBeenCalledWith(
          'typed-password',
          AUTHENTICATION_TYPE.BIOMETRIC,
        ),
      );
      expect(mockExportSeedPhrase).toHaveBeenCalledWith('typed-password');
      await waitFor(() => expect(store.getState().user.passwordSet).toBe(true));
    },
  );

  it('shows the invalid password alert, tracks the error and clears loading when exportSeedPhrase rejects', async () => {
    mockExportSeedPhrase.mockRejectedValue(new Error('Invalid password'));
    storedItems[BIOMETRY_CHOICE_DISABLED] = TRUE;
    const { findByTestId, getByTestId, queryByTestId, store } =
      renderSettings();
    await findByTestId(SecurityPrivacyViewSelectorsIDs.BIOMETRICS_TOGGLE);

    await toggle(
      getByTestId,
      SecurityPrivacyViewSelectorsIDs.BIOMETRICS_TOGGLE,
      true,
    );

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith(
        strings('app_settings.invalid_password'),
        strings('app_settings.invalid_password_message'),
      ),
    );
    expect(trackErrorAsAnalytics).toHaveBeenCalledWith(
      'SecuritySettings: Invalid password',
      'Invalid password',
      '',
    );
    expect(Authentication.resetPassword).toHaveBeenCalledTimes(1);
    expect(Authentication.storePassword).not.toHaveBeenCalled();
    expect(setItemCalls()).not.toContain(EXISTING_USER);
    expect(store.getState().user.passwordSet).toBe(false);
    await waitFor(() =>
      expect(queryByTestId(SECURITY_PRIVACY_VIEW_ID)).toBeTruthy(),
    );
  });

  it('logs other verification errors without alerting and clears loading', async () => {
    const error = new Error('Keyring locked');
    mockExportSeedPhrase.mockRejectedValue(error);
    storedItems[BIOMETRY_CHOICE_DISABLED] = TRUE;
    const { findByTestId, getByTestId } = renderSettings();
    await findByTestId(SecurityPrivacyViewSelectorsIDs.BIOMETRICS_TOGGLE);

    await toggle(
      getByTestId,
      SecurityPrivacyViewSelectorsIDs.BIOMETRICS_TOGGLE,
      true,
    );

    await waitFor(() =>
      expect(Logger.error).toHaveBeenCalledWith(
        error,
        'SecuritySettings:biometrics',
      ),
    );
    expect(Alert.alert).not.toHaveBeenCalled();
    expect(trackErrorAsAnalytics).not.toHaveBeenCalled();
    expect(await findByTestId(SECURITY_PRIVACY_VIEW_ID)).toBeTruthy();
  });

  it('still dispatches passwordSet when storePassword fails', async () => {
    const error = new Error('keychain write failed');
    jest.spyOn(Authentication, 'storePassword').mockRejectedValue(error);
    storedItems[BIOMETRY_CHOICE_DISABLED] = TRUE;
    const { findByTestId, getByTestId, store } = renderSettings();
    await findByTestId(SecurityPrivacyViewSelectorsIDs.BIOMETRICS_TOGGLE);

    await toggle(
      getByTestId,
      SecurityPrivacyViewSelectorsIDs.BIOMETRICS_TOGGLE,
      true,
    );

    await waitFor(() => expect(store.getState().user.passwordSet).toBe(true));
    expect(Logger.error).toHaveBeenCalledWith(error, {});
  });

  it('sets the default lock timeout when lockTime is -1', async () => {
    storedItems[BIOMETRY_CHOICE_DISABLED] = TRUE;
    const { findByTestId, getByTestId, store } = renderSettings({
      lockTime: -1,
    });
    await findByTestId(SecurityPrivacyViewSelectorsIDs.BIOMETRICS_TOGGLE);

    await toggle(
      getByTestId,
      SecurityPrivacyViewSelectorsIDs.BIOMETRICS_TOGGLE,
      true,
    );

    await waitFor(() =>
      expect(store.getState().settings.lockTime).toBe(
        AppConstants.DEFAULT_LOCK_TIMEOUT,
      ),
    );
    expect(store.getState().user.passwordSet).toBe(true);
  });
});
