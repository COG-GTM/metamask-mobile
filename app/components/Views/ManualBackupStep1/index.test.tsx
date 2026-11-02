import React from 'react';
import { shallow } from 'enzyme';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { wordlist } from '@metamask/scure-bip39/dist/wordlists/english';
import ManualBackupStep1 from './';
import { AppThemeKey } from '../../../util/theme/models';
import renderWithProvider from '../../../util/test/renderWithProvider';
import { Authentication } from '../../../core';
import StorageWrapper from '../../../store/storage-wrapper';
import AUTHENTICATION_TYPE from '../../../constants/userProperties';
import {
  BIOMETRY_CHOICE,
  PASSCODE_CHOICE,
  TRUE,
} from '../../../constants/storage';
import { ManualBackUpStepsSelectorsIDs } from '../../../../e2e/selectors/Onboarding/ManualBackUpSteps.selectors';

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
    getPassword: jest.fn(),
  },
}));

jest.mock('../../UI/ScreenshotDeterrent', () => ({
  ScreenshotDeterrent: () => null,
}));

jest.mock('../../../store/storage-wrapper', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

const mockStore = configureMockStore();
const initialState = {
  user: { appTheme: AppThemeKey.light },
};
const store = mockStore(initialState);

describe('ManualBackupStep1', () => {
  it('should render correctly', () => {
    const wrapper = shallow(
      <Provider store={store}>
        <ManualBackupStep1
          route={{
            params: {
              words: [
                'abstract',
                'accident',
                'acoustic',
                'announce',
                'artefact',
                'attitude',
                'bachelor',
                'broccoli',
                'business',
                'category',
                'champion',
                'cinnamon',
              ],
            },
          }}
        />
      </Provider>,
    );
    expect(wrapper).toMatchSnapshot();
  });
});

describe('ManualBackupStep1 seed phrase unlock', () => {
  const storedPassword = 'stored-password';
  const typedPassword = 'typed-password';
  const mnemonic =
    'abstract accident acoustic announce artefact attitude bachelor broccoli business category champion cinnamon';

  const navigation = { setOptions: jest.fn(), navigate: jest.fn() };

  const renderStep1 = () =>
    renderWithProvider(
      <ManualBackupStep1 route={{ params: {} }} navigation={navigation} />,
      { state: initialState },
    );

  const setup = (
    currentAuthType: AUTHENTICATION_TYPE,
    storage: Record<string, string> = {},
  ) => {
    (Authentication.getType as jest.Mock).mockResolvedValue({
      currentAuthType,
    });
    (Authentication.getPassword as jest.Mock).mockResolvedValue({
      password: storedPassword,
    });
    (StorageWrapper.getItem as jest.Mock).mockImplementation(
      async (key: string) => storage[key] ?? null,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockExportSeedPhrase.mockResolvedValue(
      new Uint8Array(
        new Uint16Array(
          mnemonic.split(' ').map((word) => wordlist.indexOf(word)),
        ).buffer,
      ),
    );
  });

  it.each([AUTHENTICATION_TYPE.REMEMBER_ME, AUTHENTICATION_TYPE.PASSWORD])(
    'requires the password and does not read the keychain for %s logins',
    async (authType) => {
      setup(authType, { [BIOMETRY_CHOICE]: TRUE });
      const { findByTestId, queryByTestId } = renderStep1();

      expect(
        await findByTestId(
          ManualBackUpStepsSelectorsIDs.CONFIRM_PASSWORD_INPUT,
        ),
      ).toBeOnTheScreen();
      expect(Authentication.getPassword).not.toHaveBeenCalled();
      expect(mockExportSeedPhrase).not.toHaveBeenCalled();
      expect(
        queryByTestId(ManualBackUpStepsSelectorsIDs.STEP_1_CONTAINER),
      ).toBeNull();
    },
  );

  it('reveals the seed phrase only after the Remember me user types the password', async () => {
    setup(AUTHENTICATION_TYPE.REMEMBER_ME);
    const { findByTestId, getByTestId, findByText } = renderStep1();

    fireEvent.changeText(
      await findByTestId(ManualBackUpStepsSelectorsIDs.CONFIRM_PASSWORD_INPUT),
      typedPassword,
    );
    fireEvent.press(getByTestId(ManualBackUpStepsSelectorsIDs.SUBMIT_BUTTON));

    expect(
      await findByTestId(ManualBackUpStepsSelectorsIDs.STEP_1_CONTAINER),
    ).toBeOnTheScreen();
    expect(mockExportSeedPhrase).toHaveBeenCalledTimes(1);
    expect(mockExportSeedPhrase).toHaveBeenCalledWith(typedPassword);

    fireEvent.press(getByTestId(ManualBackUpStepsSelectorsIDs.VIEW_BUTTON));
    expect(await findByText('1. abstract')).toBeOnTheScreen();
  });

  it.each([
    [AUTHENTICATION_TYPE.BIOMETRIC, BIOMETRY_CHOICE],
    [AUTHENTICATION_TYPE.PASSCODE, PASSCODE_CHOICE],
  ])(
    'unlocks with the stored password for %s logins',
    async (authType, choiceKey) => {
      setup(authType, { [choiceKey]: TRUE });
      const { findByTestId, queryByTestId } = renderStep1();

      expect(
        await findByTestId(ManualBackUpStepsSelectorsIDs.STEP_1_CONTAINER),
      ).toBeOnTheScreen();
      await waitFor(() =>
        expect(mockExportSeedPhrase).toHaveBeenCalledWith(storedPassword),
      );
      expect(Authentication.getPassword).toHaveBeenCalledTimes(1);
      expect(
        queryByTestId(ManualBackUpStepsSelectorsIDs.CONFIRM_PASSWORD_INPUT),
      ).toBeNull();
    },
  );

  it('requires the password for biometric logins whose password was not stored with biometrics', async () => {
    setup(AUTHENTICATION_TYPE.BIOMETRIC);
    const { findByTestId } = renderStep1();

    expect(
      await findByTestId(ManualBackUpStepsSelectorsIDs.CONFIRM_PASSWORD_INPUT),
    ).toBeOnTheScreen();
    expect(Authentication.getPassword).not.toHaveBeenCalled();
    expect(mockExportSeedPhrase).not.toHaveBeenCalled();
  });
});
