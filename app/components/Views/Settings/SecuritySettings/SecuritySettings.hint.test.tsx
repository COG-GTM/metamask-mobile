import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, waitFor } from '@testing-library/react-native';
import renderWithProvider from '../../../../util/test/renderWithProvider';
import StorageWrapper from '../../../../store/storage-wrapper';
import { SEED_PHRASE_HINTS } from '../../../../constants/storage';
import { strings } from '../../../../../locales/i18n';
import { backgroundState } from '../../../../util/test/initial-root-state';
import { MOCK_ACCOUNTS_CONTROLLER_STATE } from '../../../../util/test/accountsControllerTestUtils';
import SecuritySettings from './SecuritySettings';

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
    setOptions: jest.fn(),
    goBack: jest.fn(),
  }),
  useFocusEffect: jest.fn(),
}));

jest.mock('@react-native-cookies/cookies', () => ({
  clearAll: jest.fn(),
  getAll: jest.fn().mockResolvedValue({}),
}));

jest.mock('../../../../util/navigation/navUtils', () => ({
  ...jest.requireActual('../../../../util/navigation/navUtils'),
  useParams: jest.fn(() => ({})),
}));

jest.mock('./Sections/ProtectYourWallet/ProtectYourWallet', () => {
  const { TouchableOpacity } = jest.requireActual('react-native');
  return ({ toggleHint }: { toggleHint: () => void }) => (
    <TouchableOpacity testID="open-hint" onPress={toggleHint} />
  );
});

jest.mock('../../../UI/HintModal', () => {
  const { TextInput, TouchableOpacity } = jest.requireActual('react-native');
  return ({
    modalVisible,
    value,
    onChangeText,
    onConfirm,
  }: {
    modalVisible: boolean;
    value: string;
    onChangeText: (text: string) => void;
    onConfirm: () => void;
  }) =>
    modalVisible ? (
      <>
        <TextInput
          testID="hint-input"
          value={value}
          onChangeText={onChangeText}
        />
        <TouchableOpacity testID="hint-confirm" onPress={onConfirm} />
      </>
    ) : null;
});

const initialState = {
  privacy: { approvedHosts: {} },
  browser: { history: [] },
  settings: { lockTime: 1000, basicFunctionalityEnabled: true },
  user: { passwordSet: true, seedphraseBackedUp: true },
  engine: {
    backgroundState: {
      ...backgroundState,
      AccountsController: MOCK_ACCOUNTS_CONTROLLER_STATE,
      UserStorageController: { isProfileSyncingEnabled: false },
    },
  },
  security: { allowLoginWithRememberMe: true },
};

const SRP =
  'abandon ability able about above absent absorb abstract absurd abuse access accident';

const submitHint = async (hint: string) => {
  const utils = renderWithProvider(<SecuritySettings />, {
    state: initialState,
  });
  await waitFor(() => expect(StorageWrapper.getItem).toHaveBeenCalled());
  fireEvent.press(utils.getByTestId('open-hint'));
  fireEvent.changeText(utils.getByTestId('hint-input'), hint);
  fireEvent.press(utils.getByTestId('hint-confirm'));
  return utils;
};

describe('SecuritySettings saveHint', () => {
  let setItemSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    jest
      .spyOn(StorageWrapper, 'getItem')
      .mockImplementation(async (key: string) =>
        key === SEED_PHRASE_HINTS
          ? JSON.stringify({ manualBackup: 'old hint' })
          : null,
      );
    setItemSpy = jest
      .spyOn(StorageWrapper, 'setItem')
      .mockResolvedValue(undefined);
  });

  it('does not store a hint that contains a Secret Recovery Phrase', async () => {
    const { getByTestId } = await submitHint(`my words: ${SRP}`);

    expect(Alert.alert).toHaveBeenCalledWith(
      'Error!',
      strings('manual_backup_step_3.no_seedphrase'),
    );
    await waitFor(() =>
      expect(setItemSpy).not.toHaveBeenCalledWith(
        SEED_PHRASE_HINTS,
        expect.anything(),
      ),
    );
    expect(getByTestId('hint-input')).toBeTruthy();
  });

  it('stores an ordinary hint', async () => {
    await submitHint('blue notebook in my desk');

    await waitFor(() =>
      expect(setItemSpy).toHaveBeenCalledWith(
        SEED_PHRASE_HINTS,
        JSON.stringify({ manualBackup: 'blue notebook in my desk' }),
      ),
    );
    expect(Alert.alert).not.toHaveBeenCalled();
  });
});
