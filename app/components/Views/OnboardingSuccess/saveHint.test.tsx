import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, waitFor } from '@testing-library/react-native';
import OnboardingSuccess from './';
import renderWithProvider from '../../../util/test/renderWithProvider';
import StorageWrapper from '../../../store/storage-wrapper';
import { SEED_PHRASE_HINTS } from '../../../constants/storage';
import { strings } from '../../../../locales/i18n';

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
    setOptions: jest.fn(),
  }),
}));

jest.mock('../../../store/storage-wrapper', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.mock('../../UI/HintModal', () => {
  const { createElement } = jest.requireActual('react');
  const { View, TextInput, TouchableOpacity } =
    jest.requireActual('react-native');
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
    modalVisible
      ? createElement(
          View,
          null,
          createElement(TextInput, {
            testID: 'hint-input',
            value,
            onChangeText,
          }),
          createElement(TouchableOpacity, {
            testID: 'hint-confirm',
            onPress: onConfirm,
          }),
        )
      : null;
});

const mockGetItem = StorageWrapper.getItem as jest.Mock;
const mockSetItem = StorageWrapper.setItem as jest.Mock;

const srp =
  'abandon ability able about above absent absorb abstract absurd abuse access accident';

const submitHint = (hint: string) => {
  const { getByText, getByTestId } = renderWithProvider(
    <OnboardingSuccess onDone={jest.fn()} backedUpSRP />,
  );
  fireEvent.press(getByText(strings('onboarding_success.leave_hint')));
  fireEvent.changeText(getByTestId('hint-input'), hint);
  fireEvent.press(getByTestId('hint-confirm'));
  return getByTestId;
};

describe('OnboardingSuccess saveHint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetItem.mockResolvedValue(JSON.stringify({}));
  });

  it('refuses to store a hint that contains the Secret Recovery Phrase', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());

    const getByTestId = submitHint(srp);

    expect(alertSpy).toHaveBeenCalledWith(
      'Error!',
      strings('manual_backup_step_3.no_seedphrase'),
    );
    expect(getByTestId('hint-input')).toBeTruthy();
    await waitFor(() => expect(mockGetItem).not.toHaveBeenCalled());
    expect(mockSetItem).not.toHaveBeenCalled();
  });

  it('stores an ordinary hint', async () => {
    submitHint("Mom's house");

    await waitFor(() =>
      expect(mockSetItem).toHaveBeenCalledWith(
        SEED_PHRASE_HINTS,
        JSON.stringify({ manualBackup: "Mom's house" }),
      ),
    );
  });
});
