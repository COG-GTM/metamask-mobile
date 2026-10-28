import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, waitFor } from '@testing-library/react-native';
import renderWithProvider from '../../../util/test/renderWithProvider';
import StorageWrapper from '../../../store/storage-wrapper';
import { SEED_PHRASE_HINTS } from '../../../constants/storage';
import { strings } from '../../../../locales/i18n';
import OnboardingSuccess from './';

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: jest.fn(), setOptions: jest.fn() }),
}));

jest.mock('../../../util/importAdditionalAccounts', () => jest.fn());

const mockTrackOnboarding = jest.fn();
jest.mock(
  '../../../util/metrics/TrackOnboarding/trackOnboarding',
  () =>
    (...args: unknown[]) =>
      mockTrackOnboarding(...args),
);

jest.mock('../../UI/HintModal', () => {
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

const SRP_WORDS =
  'abandon ability able about above absent absorb abstract absurd abuse access accident'.split(
    ' ',
  );

const renderAndSubmitHint = (hint: string) => {
  const utils = renderWithProvider(
    <OnboardingSuccess onDone={jest.fn()} backedUpSRP words={SRP_WORDS} />,
  );
  fireEvent.press(utils.getByText(strings('onboarding_success.leave_hint')));
  fireEvent.changeText(utils.getByTestId('hint-input'), hint);
  fireEvent.press(utils.getByTestId('hint-confirm'));
  return utils;
};

describe('OnboardingSuccess saveHint', () => {
  let setItemSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    jest
      .spyOn(StorageWrapper, 'getItem')
      .mockResolvedValue(JSON.stringify({ existing: 'value' }));
    setItemSpy = jest
      .spyOn(StorageWrapper, 'setItem')
      .mockResolvedValue(undefined);
  });

  it.each([
    ['the exact phrase', SRP_WORDS.join(' ')],
    ['the phrase in upper case', SRP_WORDS.join(' ').toUpperCase()],
    ['most of the phrase in order', SRP_WORDS.slice(0, 8).join(' ')],
  ])('does not store %s and shows an error', async (_, hint) => {
    const { getByTestId } = renderAndSubmitHint(hint);

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error!',
        strings('manual_backup_step_3.no_seedphrase'),
      ),
    );
    expect(StorageWrapper.getItem).not.toHaveBeenCalled();
    expect(setItemSpy).not.toHaveBeenCalled();
    expect(mockTrackOnboarding).not.toHaveBeenCalled();
    expect(getByTestId('hint-input')).toBeTruthy();
  });

  it('stores an ordinary hint', async () => {
    const { queryByTestId } = renderAndSubmitHint('blue notebook in my desk');

    await waitFor(() =>
      expect(setItemSpy).toHaveBeenCalledWith(
        SEED_PHRASE_HINTS,
        JSON.stringify({
          existing: 'value',
          manualBackup: 'blue notebook in my desk',
        }),
      ),
    );
    expect(Alert.alert).not.toHaveBeenCalled();
    expect(mockTrackOnboarding).toHaveBeenCalledTimes(1);
    expect(queryByTestId('hint-input')).toBeNull();
  });
});
