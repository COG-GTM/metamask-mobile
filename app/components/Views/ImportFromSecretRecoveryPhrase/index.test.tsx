import React from 'react';
import { Alert, Platform } from 'react-native';
import { act, fireEvent, waitFor } from '@testing-library/react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { renderScreen } from '../../../util/test/renderWithProvider';
import ImportFromSecretRecoveryPhrase from '.';
import Routes from '../../../constants/navigation/Routes';
import { Authentication } from '../../../core';
import AppConstants from '../../../core/AppConstants';
import { MetaMetricsEvents } from '../../../core/Analytics';
import StorageWrapper from '../../../store/storage-wrapper';
import Device from '../../../util/device';
import Logger from '../../../util/Logger';
import trackOnboarding from '../../../util/metrics/TrackOnboarding/trackOnboarding';
import { strings } from '../../../../locales/i18n';
import { ImportFromSeedSelectorsIDs } from '../../../../e2e/selectors/Onboarding/ImportFromSeed.selectors';
import { ChoosePasswordSelectorsIDs } from '../../../../e2e/selectors/Onboarding/ChoosePassword.selectors';
import { ONBOARDING_WIZARD } from '../../../constants/storage';
import AUTHENTICATION_TYPE from '../../../constants/userProperties';

jest.mock('../../../util/metrics/TrackOnboarding/trackOnboarding', () =>
  jest.fn(),
);
jest.mock('../../../util/termsOfUse/termsOfUse', () => jest.fn());

const VALID_SRP =
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const INVALID_CHECKSUM_SRP = Array(12).fill('abandon').join(' ');
const ELEVEN_WORD_SRP = Array(11).fill('abandon').join(' ');
const PASSWORD = 'correct-horse-battery';
const AUTH_DATA = {
  currentAuthType: AUTHENTICATION_TYPE.BIOMETRIC,
  availableBiometryType: 'FaceID',
};
const PASSWORD_AUTH_DATA = {
  currentAuthType: AUTHENTICATION_TYPE.PASSWORD,
  availableBiometryType: undefined,
};
const RETRY_AUTH_DATA = {
  currentAuthType: AUTHENTICATION_TYPE.PASSWORD,
  availableBiometryType: 'FaceID',
};
const IOS_REJECTED_BIOMETRICS_ERROR =
  'The user name or passphrase you entered is not correct.';

const initialState = {
  user: {
    passwordSet: true,
    seedphraseBackedUp: false,
  },
};

const importState = {
  user: {
    passwordSet: false,
    seedphraseBackedUp: false,
  },
  settings: {
    lockTime: -1,
  },
  wizard: {
    step: 0,
  },
};

const mockNavigation = {
  navigate: jest.fn(),
  reset: jest.fn(),
  setOptions: jest.fn(),
  goBack: jest.fn(),
};

const trackedEvents = () =>
  (trackOnboarding as jest.Mock).mock.calls.map(([event]) => event);

const findTrackedEvent = (event: { category: string }) =>
  trackedEvents().find(({ name }) => name === event.category);

const ImportScreenWithMockNavigation = () => (
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - connected JS component without typed props
  <ImportFromSecretRecoveryPhrase
    navigation={mockNavigation}
    route={{ params: {} }}
  />
);

const renderImport = () =>
  renderScreen(
    ImportScreenWithMockNavigation,
    { name: Routes.ONBOARDING.IMPORT_FROM_SECRET_RECOVERY_PHRASE },
    { state: importState },
  );

type RenderResult = ReturnType<typeof renderImport>;

const fillForm = (
  { getByTestId }: RenderResult,
  {
    seed = VALID_SRP,
    password = PASSWORD,
    confirmPassword = password,
  }: { seed?: string; password?: string; confirmPassword?: string } = {},
) => {
  fireEvent.changeText(
    getByTestId(ImportFromSeedSelectorsIDs.SEED_PHRASE_INPUT_ID),
    seed,
  );
  fireEvent.changeText(
    getByTestId(ChoosePasswordSelectorsIDs.NEW_PASSWORD_INPUT_ID),
    password,
  );
  fireEvent.changeText(
    getByTestId(ChoosePasswordSelectorsIDs.CONFIRM_PASSWORD_INPUT_ID),
    confirmPassword,
  );
};

const submitForm = async ({ getByTestId }: RenderResult) => {
  await act(async () => {
    fireEvent(
      getByTestId(ChoosePasswordSelectorsIDs.CONFIRM_PASSWORD_INPUT_ID),
      'submitEditing',
    );
  });
};

describe('ImportFromSecretRecoveryPhrase', () => {
  it('should render correctly', () => {
    const { toJSON } = renderScreen(
      ImportFromSecretRecoveryPhrase,
      { name: Routes.ONBOARDING.IMPORT_FROM_SECRET_RECOVERY_PHRASE },
      { state: initialState },
    );
    expect(toJSON()).toMatchSnapshot();
  });

  describe('onPressImport', () => {
    let alertSpy: jest.SpyInstance;
    let newWalletAndRestoreSpy: jest.SpyInstance;
    let componentAuthenticationTypeSpy: jest.SpyInstance;
    let isIosSpy: jest.SpyInstance;

    beforeEach(() => {
      jest.clearAllMocks();
      alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
      jest.spyOn(Logger, 'log').mockImplementation(jest.fn());
      jest
        .spyOn(Authentication, 'getType')
        .mockResolvedValue(PASSWORD_AUTH_DATA as never);
      componentAuthenticationTypeSpy = jest
        .spyOn(Authentication, 'componentAuthenticationType')
        .mockResolvedValue(AUTH_DATA as never);
      newWalletAndRestoreSpy = jest
        .spyOn(Authentication, 'newWalletAndRestore')
        .mockResolvedValue(undefined);
      jest
        .spyOn(StorageWrapper, 'getItem')
        .mockImplementation(async () => null);
      jest.spyOn(StorageWrapper, 'setItem').mockResolvedValue(undefined);
      isIosSpy = jest.spyOn(Device, 'isIos').mockReturnValue(true);
      jest.spyOn(Device, 'isAndroid').mockReturnValue(false);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    const expectNoSuccessFlow = (store: RenderResult['store']) => {
      const state = store.getState();
      expect(state.user.passwordSet).toBe(false);
      expect(state.user.seedphraseBackedUp).toBe(false);
      expect(state.settings.lockTime).toBe(-1);
      expect(mockNavigation.reset).not.toHaveBeenCalled();
      expect(findTrackedEvent(MetaMetricsEvents.WALLET_IMPORTED)).toBe(
        undefined,
      );
      expect(findTrackedEvent(MetaMetricsEvents.WALLET_SETUP_COMPLETED)).toBe(
        undefined,
      );
    };

    describe('validation', () => {
      it.each([
        [
          'password is shorter than the minimum length',
          { password: 'short', confirmPassword: 'short' },
          'import_from_seed.password_length_error',
        ],
        [
          'passwords do not match',
          { password: PASSWORD, confirmPassword: `${PASSWORD}-typo` },
          'import_from_seed.password_dont_match',
        ],
        [
          'the SRP has an unsupported word count',
          { seed: ELEVEN_WORD_SRP },
          'import_from_seed.seed_phrase_requirements',
        ],
        [
          'the SRP is not a valid mnemonic',
          { seed: INVALID_CHECKSUM_SRP },
          'import_from_seed.invalid_seed_phrase',
        ],
      ])(
        'alerts and tracks WALLET_SETUP_FAILURE when %s',
        async (_, formValues, errorKey) => {
          const result = renderImport();
          fillForm(result, formValues);
          await submitForm(result);

          expect(alertSpy).toHaveBeenCalledTimes(1);
          expect(alertSpy).toHaveBeenCalledWith(
            strings('import_from_seed.error'),
            strings(errorKey),
          );
          expect(
            findTrackedEvent(MetaMetricsEvents.WALLET_SETUP_FAILURE)
              ?.properties,
          ).toEqual({
            wallet_setup_type: 'import',
            error_type: strings(errorKey),
          });
          expect(componentAuthenticationTypeSpy).not.toHaveBeenCalled();
          expect(newWalletAndRestoreSpy).not.toHaveBeenCalled();
          expectNoSuccessFlow(result.store);
        },
      );

      it('normalizes the SRP before validating it', async () => {
        const result = renderImport();
        fillForm(result, { seed: `  ${VALID_SRP.toUpperCase()}  ` });
        await submitForm(result);

        expect(alertSpy).not.toHaveBeenCalled();
        expect(newWalletAndRestoreSpy).toHaveBeenCalledWith(
          PASSWORD,
          AUTH_DATA,
          VALID_SRP,
          true,
        );
      });
    });

    describe('restore', () => {
      it('restores the wallet, marks setup complete and navigates to the success flow', async () => {
        const result = renderImport();
        fillForm(result);
        await act(async () => {
          fireEvent.press(
            result.getByTestId(ImportFromSeedSelectorsIDs.SUBMIT_BUTTON_ID),
          );
        });

        expect(componentAuthenticationTypeSpy).toHaveBeenCalledWith(
          false,
          false,
        );
        expect(newWalletAndRestoreSpy).toHaveBeenCalledTimes(1);
        expect(newWalletAndRestoreSpy).toHaveBeenCalledWith(
          PASSWORD,
          AUTH_DATA,
          VALID_SRP,
          true,
        );
        expect(StorageWrapper.getItem).toHaveBeenCalledWith(ONBOARDING_WIZARD);

        const state = result.store.getState();
        expect(state.user.passwordSet).toBe(true);
        expect(state.user.seedphraseBackedUp).toBe(true);
        expect(state.settings.lockTime).toBe(AppConstants.DEFAULT_LOCK_TIMEOUT);
        expect(state.wizard.step).toBe(1);
        expect(mockNavigation.reset).toHaveBeenCalledWith({
          index: 1,
          routes: [{ name: Routes.ONBOARDING.SUCCESS_FLOW }],
        });
        expect(
          findTrackedEvent(MetaMetricsEvents.WALLET_SETUP_COMPLETED)
            ?.properties,
        ).toEqual({ wallet_setup_type: 'import', new_wallet: false });
        expect(
          findTrackedEvent(MetaMetricsEvents.WALLET_IMPORTED),
        ).toBeDefined();
        expect(
          findTrackedEvent(MetaMetricsEvents.WALLET_SETUP_FAILURE),
        ).toBeUndefined();
        expect(alertSpy).not.toHaveBeenCalled();
      });

      it('does not restart the onboarding wizard when it was already seen', async () => {
        (StorageWrapper.getItem as jest.Mock).mockImplementation(
          async (key: string) =>
            key === ONBOARDING_WIZARD ? 'explored' : null,
        );
        const result = renderImport();
        fillForm(result);
        await submitForm(result);

        expect(result.store.getState().wizard.step).toBe(0);
        expect(mockNavigation.reset).toHaveBeenCalledTimes(1);
      });

      it('retries with password auth when iOS biometrics are rejected', async () => {
        newWalletAndRestoreSpy
          .mockRejectedValueOnce(new Error(IOS_REJECTED_BIOMETRICS_ERROR))
          .mockResolvedValueOnce(undefined);
        componentAuthenticationTypeSpy
          .mockResolvedValueOnce(AUTH_DATA as never)
          .mockResolvedValueOnce(RETRY_AUTH_DATA as never);

        const result = renderImport();
        fillForm(result);
        await submitForm(result);

        expect(componentAuthenticationTypeSpy).toHaveBeenNthCalledWith(
          2,
          false,
          false,
        );
        expect(newWalletAndRestoreSpy).toHaveBeenCalledTimes(2);
        expect(newWalletAndRestoreSpy).toHaveBeenNthCalledWith(
          2,
          PASSWORD,
          RETRY_AUTH_DATA,
          VALID_SRP,
          true,
        );
        expect(result.store.getState().user.passwordSet).toBe(true);
        expect(mockNavigation.reset).toHaveBeenCalledTimes(1);
      });

      it('stops the success flow when the iOS biometric retry also fails', async () => {
        newWalletAndRestoreSpy
          .mockRejectedValueOnce(new Error(IOS_REJECTED_BIOMETRICS_ERROR))
          .mockRejectedValueOnce(new Error('Vault creation failed'));

        const result = renderImport();
        fillForm(result);
        await submitForm(result);

        expect(newWalletAndRestoreSpy).toHaveBeenCalledTimes(2);
        await waitFor(() =>
          expect(
            result.getByTestId(
              ImportFromSeedSelectorsIDs.INVALID_SEED_PHRASE_PLACE_HOLDER_TEXT,
            ),
          ).toHaveTextContent('Vault creation failed'),
        );
        expect(
          findTrackedEvent(MetaMetricsEvents.WALLET_SETUP_FAILURE)?.properties,
        ).toEqual({
          wallet_setup_type: 'import',
          error_type: 'Error: Vault creation failed',
        });
        expectNoSuccessFlow(result.store);
      });

      it.each([
        ['Android', false],
        ['iOS', true],
      ])(
        'surfaces a non-biometric restore error on %s instead of completing setup',
        async (_, isIos) => {
          isIosSpy.mockReturnValue(isIos);
          newWalletAndRestoreSpy.mockRejectedValueOnce(
            new Error('Keyring restore failed'),
          );

          const result = renderImport();
          fillForm(result);
          await submitForm(result);

          expect(newWalletAndRestoreSpy).toHaveBeenCalledTimes(1);
          expect(
            result.getByTestId(
              ImportFromSeedSelectorsIDs.INVALID_SEED_PHRASE_PLACE_HOLDER_TEXT,
            ),
          ).toHaveTextContent('Keyring restore failed');
          expect(
            findTrackedEvent(MetaMetricsEvents.WALLET_SETUP_FAILURE)
              ?.properties,
          ).toEqual({
            wallet_setup_type: 'import',
            error_type: 'Error: Keyring restore failed',
          });
          expectNoSuccessFlow(result.store);
        },
      );

      it('does not retry the biometric rejection error on Android', async () => {
        isIosSpy.mockReturnValue(false);
        newWalletAndRestoreSpy.mockRejectedValueOnce(
          new Error(IOS_REJECTED_BIOMETRICS_ERROR),
        );

        const result = renderImport();
        fillForm(result);
        await submitForm(result);

        expect(newWalletAndRestoreSpy).toHaveBeenCalledTimes(1);
        expect(componentAuthenticationTypeSpy).toHaveBeenCalledTimes(1);
        expectNoSuccessFlow(result.store);
      });

      it.each([
        ['componentAuthenticationType', 'auth'],
        ['newWalletAndRestore', 'restore'],
      ])(
        'shows the passcode security alert when %s reports no passcode',
        async (_, source) => {
          const passcodeError = new Error('Passcode not set.');
          if (source === 'auth') {
            componentAuthenticationTypeSpy.mockRejectedValueOnce(passcodeError);
          } else {
            newWalletAndRestoreSpy.mockRejectedValueOnce(passcodeError);
          }

          const result = renderImport();
          fillForm(result);
          await submitForm(result);

          expect(alertSpy).toHaveBeenCalledWith(
            'Security Alert',
            expect.stringContaining('you need to turn Passcode on'),
          );
          expect(
            result.queryByTestId(
              ImportFromSeedSelectorsIDs.INVALID_SEED_PHRASE_PLACE_HOLDER_TEXT,
            ),
          ).toBeNull();
          expect(
            findTrackedEvent(MetaMetricsEvents.WALLET_SETUP_FAILURE)
              ?.properties,
          ).toEqual({
            wallet_setup_type: 'import',
            error_type: 'Error: Passcode not set.',
          });
          expectNoSuccessFlow(result.store);
        },
      );

      it('shows other authentication errors inline and logs them', async () => {
        componentAuthenticationTypeSpy.mockRejectedValueOnce(
          new Error('Keychain unavailable'),
        );

        const result = renderImport();
        fillForm(result);
        await submitForm(result);

        expect(alertSpy).not.toHaveBeenCalled();
        expect(
          result.getByTestId(
            ImportFromSeedSelectorsIDs.INVALID_SEED_PHRASE_PLACE_HOLDER_TEXT,
          ),
        ).toHaveTextContent('Keychain unavailable');
        expect(Logger.log).toHaveBeenCalledWith(
          'Error with seed phrase import',
          'Keychain unavailable',
        );
        expect(newWalletAndRestoreSpy).not.toHaveBeenCalled();
        expectNoSuccessFlow(result.store);
      });
    });
  });

  describe('clipboard clearing on Android', () => {
    const originalConstants = Platform.constants;

    beforeEach(() => {
      jest.clearAllMocks();
      jest
        .spyOn(Authentication, 'getType')
        .mockResolvedValue(PASSWORD_AUTH_DATA as never);
      jest
        .spyOn(StorageWrapper, 'getItem')
        .mockImplementation(async () => null);
      jest.spyOn(Device, 'isAndroid').mockReturnValue(true);
      // The shared jest clipboard mock does not implement clearString
      (Clipboard as unknown as { clearString: jest.Mock }).clearString = jest
        .fn()
        .mockResolvedValue(undefined);
      Object.defineProperty(Platform, 'constants', {
        configurable: true,
        get: () => ({ ...originalConstants, Release: '13' }),
      });
    });

    afterEach(() => {
      Object.defineProperty(Platform, 'constants', {
        configurable: true,
        get: () => originalConstants,
      });
      jest.restoreAllMocks();
    });

    const enterSeed = async (seed: string, clipboardContents: string) => {
      (Clipboard.getString as jest.Mock).mockResolvedValue(clipboardContents);
      const { getByTestId } = renderImport();
      await act(async () => {
        fireEvent.changeText(
          getByTestId(ImportFromSeedSelectorsIDs.SEED_PHRASE_INPUT_ID),
          seed,
        );
      });
    };

    it('clears the clipboard when it holds the same valid SRP', async () => {
      await enterSeed(VALID_SRP, `  ${VALID_SRP.toUpperCase()}\n`);

      expect(Clipboard.getString).toHaveBeenCalled();
      expect(Clipboard.clearString).toHaveBeenCalledTimes(1);
    });

    it.each([
      [
        'a different valid SRP',
        'legal winner thank year wave sausage worth useful legal winner thank yellow',
      ],
      ['an invalid mnemonic', INVALID_CHECKSUM_SRP],
      ['an SRP with an unsupported word count', ELEVEN_WORD_SRP],
      ['unrelated text', 'hello world'],
    ])('keeps the clipboard when it holds %s', async (_, clipboard) => {
      await enterSeed(VALID_SRP, clipboard);

      expect(Clipboard.getString).toHaveBeenCalled();
      expect(Clipboard.clearString).not.toHaveBeenCalled();
    });

    it('does not read the clipboard on Android versions below 9', async () => {
      Object.defineProperty(Platform, 'constants', {
        configurable: true,
        get: () => ({ ...originalConstants, Release: '8.1.0' }),
      });
      await enterSeed(VALID_SRP, VALID_SRP);

      expect(Clipboard.getString).not.toHaveBeenCalled();
      expect(Clipboard.clearString).not.toHaveBeenCalled();
    });

    it('does not read the clipboard on iOS', async () => {
      (Device.isAndroid as jest.Mock).mockReturnValue(false);
      await enterSeed(VALID_SRP, VALID_SRP);

      expect(Clipboard.getString).not.toHaveBeenCalled();
      expect(Clipboard.clearString).not.toHaveBeenCalled();
    });
  });
});
