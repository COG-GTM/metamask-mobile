import React from 'react';
import { shallow } from 'enzyme';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { act, fireEvent, waitFor } from '@testing-library/react-native';
import { wordlist } from '@metamask/scure-bip39/dist/wordlists/english';
import ManualBackupStep1 from './';
import { AppThemeKey } from '../../../util/theme/models';
import renderWithProvider from '../../../util/test/renderWithProvider';
import { Authentication } from '../../../core';
import Logger from '../../../util/Logger';
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
    getPassword: jest.fn(),
  },
}));

jest.mock('../../../util/Logger', () => ({
  error: jest.fn(),
  log: jest.fn(),
}));

jest.mock('../../UI/ScreenshotDeterrent', () => ({
  ScreenshotDeterrent: () => null,
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

describe('ManualBackupStep1 seed phrase retrieval', () => {
  const storedPassword = 'stored-password';
  const exportedWords = [
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
  ];
  const routeWords = [
    'zebra',
    'zero',
    'zone',
    'zoo',
    'youth',
    'young',
    'yellow',
    'year',
    'wrong',
    'write',
    'wrist',
    'world',
  ];

  const toExportedSeedPhrase = (words: string[]) =>
    new Uint8Array(
      new Uint16Array(words.map((word) => wordlist.indexOf(word))).buffer,
    );

  const navigation = { setOptions: jest.fn(), navigate: jest.fn() };

  const renderStep1 = (params: { words?: string[] } = {}) =>
    renderWithProvider(
      <ManualBackupStep1 route={{ params }} navigation={navigation} />,
      { state: initialState },
    );

  const revealAndGetWords = async (
    utils: ReturnType<typeof renderStep1>,
    expectedCount: number,
  ) => {
    fireEvent.press(
      await utils.findByTestId(ManualBackUpStepsSelectorsIDs.VIEW_BUTTON),
    );
    const rendered = await utils.findAllByText(/^\d+\. \S+$/);
    expect(rendered).toHaveLength(expectedCount);
    return rendered.map((node) => node.props.children as string);
  };

  const expectConfirmPasswordView = async (
    utils: ReturnType<typeof renderStep1>,
  ) => {
    expect(
      await utils.findByTestId(
        ManualBackUpStepsSelectorsIDs.CONFIRM_PASSWORD_INPUT,
      ),
    ).toBeOnTheScreen();
    expect(
      utils.queryByTestId(ManualBackUpStepsSelectorsIDs.STEP_1_CONTAINER),
    ).toBeNull();
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the exported seed phrase words in order when credentials are stored', async () => {
    (Authentication.getPassword as jest.Mock).mockResolvedValue({
      password: storedPassword,
    });
    mockExportSeedPhrase.mockResolvedValue(toExportedSeedPhrase(exportedWords));

    const utils = renderStep1();

    await waitFor(() =>
      expect(mockExportSeedPhrase).toHaveBeenCalledWith(storedPassword),
    );
    const words = await revealAndGetWords(utils, exportedWords.length);
    expect(words).toEqual(exportedWords.map((w, i) => `${i + 1}. ${w}`));
    expect(Logger.error).not.toHaveBeenCalled();
    expect(
      utils.queryByTestId(ManualBackUpStepsSelectorsIDs.CONFIRM_PASSWORD_INPUT),
    ).toBeNull();

    fireEvent.press(
      utils.getByTestId(ManualBackUpStepsSelectorsIDs.CONTINUE_BUTTON),
    );
    expect(navigation.navigate).toHaveBeenCalledWith(
      'ManualBackupStep2',
      expect.objectContaining({ words: exportedWords }),
    );
  });

  it('shows the confirm password view when no credentials are stored', async () => {
    (Authentication.getPassword as jest.Mock).mockResolvedValue(null);

    const utils = renderStep1();

    await expectConfirmPasswordView(utils);
    expect(Authentication.getPassword).toHaveBeenCalledTimes(1);
    expect(mockExportSeedPhrase).not.toHaveBeenCalled();
    expect(Logger.error).not.toHaveBeenCalled();
  });

  it('logs and falls back to the confirm password view when exportSeedPhrase rejects', async () => {
    (Authentication.getPassword as jest.Mock).mockResolvedValue({
      password: storedPassword,
    });
    mockExportSeedPhrase.mockRejectedValue(new Error('Decrypt failed'));

    const utils = renderStep1();

    await expectConfirmPasswordView(utils);
    expect(mockExportSeedPhrase).toHaveBeenCalledWith(storedPassword);
    expect(Logger.error).toHaveBeenCalledTimes(1);
    expect((Logger.error as jest.Mock).mock.calls[0][0]).toEqual(
      new Error('Error trying to recover SRP from keyring-controller'),
    );
  });

  it('logs and falls back to the confirm password view when getPassword rejects', async () => {
    (Authentication.getPassword as jest.Mock).mockRejectedValue(
      new Error('keychain unavailable'),
    );

    const utils = renderStep1();

    await expectConfirmPasswordView(utils);
    expect(mockExportSeedPhrase).not.toHaveBeenCalled();
    expect(Logger.error).toHaveBeenCalledTimes(1);
  });

  it('renders route.params.words while the keychain lookup is pending', async () => {
    (Authentication.getPassword as jest.Mock).mockReturnValue(
      new Promise(() => undefined),
    );

    const utils = renderStep1({ words: routeWords });

    const words = await revealAndGetWords(utils, routeWords.length);
    expect(words).toEqual(routeWords.map((w, i) => `${i + 1}. ${w}`));
    expect(mockExportSeedPhrase).not.toHaveBeenCalled();
  });

  it('does not let the synchronous route.params.words update overwrite the exported words', async () => {
    let resolveExport: (value: Uint8Array) => void = () => undefined;
    (Authentication.getPassword as jest.Mock).mockResolvedValue({
      password: storedPassword,
    });
    mockExportSeedPhrase.mockReturnValue(
      new Promise<Uint8Array>((resolve) => {
        resolveExport = resolve;
      }),
    );

    const utils = renderStep1({ words: routeWords });

    await waitFor(() => expect(mockExportSeedPhrase).toHaveBeenCalled());
    expect(await revealAndGetWords(utils, routeWords.length)).toEqual(
      routeWords.map((w, i) => `${i + 1}. ${w}`),
    );

    await act(async () => {
      resolveExport(toExportedSeedPhrase(exportedWords));
    });

    await waitFor(() =>
      expect(utils.getByText(`1. ${exportedWords[0]}`)).toBeOnTheScreen(),
    );
    const rendered = utils
      .getAllByText(/^\d+\. \S+$/)
      .map((node) => node.props.children);
    expect(rendered).toEqual(exportedWords.map((w, i) => `${i + 1}. ${w}`));
  });

  it('does not blank the exported words when route.params.words is absent', async () => {
    (Authentication.getPassword as jest.Mock).mockResolvedValue({
      password: storedPassword,
    });
    mockExportSeedPhrase.mockResolvedValue(toExportedSeedPhrase(exportedWords));

    const utils = renderStep1();

    const words = await revealAndGetWords(utils, exportedWords.length);
    expect(words[0]).toBe(`1. ${exportedWords[0]}`);
    expect(words[11]).toBe(`12. ${exportedWords[11]}`);
  });
});
