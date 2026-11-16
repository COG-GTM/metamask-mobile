import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import configureMockStore from 'redux-mock-store';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { backgroundState } from '../../../util/test/initial-root-state';
import { RevealPrivateCredential } from './';
import { ThemeContext, mockTheme } from '../../../util/theme';
import { RevealSeedViewSelectorsIDs } from '../../../../e2e/selectors/Settings/SecurityAndPrivacy/RevealSeedView.selectors';
import { EthAccountType, EthMethod, EthScope } from '@metamask/keyring-api';
import { KeyringTypes } from '@metamask/keyring-controller';
import { wordlist } from '@metamask/scure-bip39/dist/wordlists/english';
import Authentication from '../../../core/Authentication';
import StorageWrapper from '../../../store/storage-wrapper';
import { isHardwareAccount } from '../../../util/address';
import { BIOMETRY_CHOICE } from '../../../constants/storage';
import { strings } from '../../../../locales/i18n';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
}));

jest.mock('react-native-scrollable-tab-view', () => {
  const { createElement } = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  const MockScrollableTabView = ({ children }: { children: React.ReactNode }) =>
    createElement(View, null, children);
  return {
    __esModule: true,
    default: MockScrollableTabView,
    DefaultTabBar: () => null,
  };
});

const mockExportSeedPhrase = jest.fn();
const mockExportAccount = jest.fn();
const mockVerifyPassword = jest.fn();

jest.mock('../../../core/Engine', () => ({
  context: {
    KeyringController: {
      exportSeedPhrase: (...args: unknown[]) => mockExportSeedPhrase(...args),
      exportAccount: (...args: unknown[]) => mockExportAccount(...args),
      verifyPassword: (...args: unknown[]) => mockVerifyPassword(...args),
    },
  },
}));

jest.mock('../../../core/Authentication', () => ({
  __esModule: true,
  default: {
    getType: jest.fn(),
    getPassword: jest.fn(),
  },
}));

jest.mock('../../../store/storage-wrapper', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

jest.mock('../../../util/address', () => ({
  ...jest.requireActual('../../../util/address'),
  isHardwareAccount: jest.fn(),
}));

const mockUseSelector = useSelector as jest.Mock;
const mockUseDispatch = useDispatch as jest.Mock;
const mockGetType = Authentication.getType as jest.Mock;
const mockGetPassword = Authentication.getPassword as jest.Mock;
const mockGetItem = StorageWrapper.getItem as jest.Mock;
const mockIsHardwareAccount = isHardwareAccount as jest.Mock;

const MOCK_MNEMONIC_INDICES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MOCK_SEED = new Uint8Array(new Uint16Array(MOCK_MNEMONIC_INDICES).buffer);
const MOCK_MNEMONIC = MOCK_MNEMONIC_INDICES.map((i) => wordlist[i]).join(' ');
const MOCK_PRIVATE_KEY =
  '0x1111111111111111111111111111111111111111111111111111111111111111';
const MOCK_ADDRESS = '0x1234567890123456789012345678901234567890';

const mockStore = configureMockStore();
const initialState = {
  engine: {
    backgroundState,
  },
  user: {
    passwordSet: false,
  },
};
const store = mockStore(initialState);

describe('RevealPrivateCredential', () => {
  const SRP_CREDENTIAL = 'seed_phrase';
  const PRIV_KEY_CREDENTIAL = 'private_key';

  let mockPasswordSet: boolean;

  beforeEach(() => {
    mockPasswordSet = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseSelector.mockImplementation((selector: (state: any) => unknown) =>
      selector({ ...initialState, user: { passwordSet: mockPasswordSet } }),
    );
    mockUseDispatch.mockReturnValue(jest.fn());
    mockGetType.mockResolvedValue({ availableBiometryType: undefined });
    mockGetPassword.mockResolvedValue(null);
    mockGetItem.mockResolvedValue(null);
    mockIsHardwareAccount.mockReturnValue(false);
    mockExportSeedPhrase.mockResolvedValue(MOCK_SEED);
    mockExportAccount.mockResolvedValue(MOCK_PRIVATE_KEY);
    mockVerifyPassword.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderWithProviders = (ui: React.ReactNode) =>
    render(
      <Provider store={store}>
        <ThemeContext.Provider value={mockTheme}>{ui}</ThemeContext.Provider>
      </Provider>,
    );

  it('renders reveal SRP correctly when the credential is directly passed', () => {
    const { toJSON } = renderWithProviders(
      <RevealPrivateCredential
        route={{
          key: 'RevealPrivateCredential',
          name: 'RevealPrivateCredential',
          params: {
            credentialName: '',
          },
        }}
        navigation={null}
        cancel={() => null}
        credentialName={SRP_CREDENTIAL}
      />,
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders reveal SRP correctly when the credential is passed via the route object', () => {
    const { toJSON } = renderWithProviders(
      <RevealPrivateCredential
        route={{
          key: 'RevealPrivateCredential',
          name: 'RevealPrivateCredential',
          params: {
            credentialName: SRP_CREDENTIAL,
          },
        }}
        navigation={null}
        cancel={() => null}
        // @ts-expect-error - The error is ignored for testing purposes
        credentialName={undefined}
      />,
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders reveal private key correctly', () => {
    const { toJSON } = renderWithProviders(
      <RevealPrivateCredential
        route={{
          key: 'RevealPrivateCredential',
          name: 'RevealPrivateCredential',
          params: {
            credentialName: PRIV_KEY_CREDENTIAL,
          },
        }}
        navigation={null}
        cancel={() => null}
        credentialName={PRIV_KEY_CREDENTIAL}
      />,
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('shows warning message on incorrect password', async () => {
    mockVerifyPassword.mockRejectedValue(new Error('Invalid password'));
    const { getByPlaceholderText, getByTestId } = renderWithProviders(
      <RevealPrivateCredential
        route={{
          key: 'RevealPrivateCredential',
          name: 'RevealPrivateCredential',
          params: {
            credentialName: SRP_CREDENTIAL,
          },
        }}
        navigation={null}
        cancel={() => null}
        credentialName={SRP_CREDENTIAL}
      />,
    );
    const passwordInput = getByPlaceholderText('Password');
    fireEvent.changeText(passwordInput, 'wrong-password');
    fireEvent(passwordInput, 'submitEditing');
    await waitFor(() => {
      expect(
        getByTestId(RevealSeedViewSelectorsIDs.PASSWORD_WARNING_ID),
      ).toHaveProperty('props.children', 'Incorrect password');
    });
    expect(mockVerifyPassword).toHaveBeenCalledWith('wrong-password');
    expect(mockExportSeedPhrase).not.toHaveBeenCalled();
  });

  it('shows modal on correct password', async () => {
    const { getByPlaceholderText, getByTestId } = renderWithProviders(
      <RevealPrivateCredential
        route={{
          key: 'RevealPrivateCredential',
          name: 'RevealPrivateCredential',
          params: {
            credentialName: SRP_CREDENTIAL,
          },
        }}
        navigation={null}
        cancel={() => null}
        credentialName={SRP_CREDENTIAL}
      />,
    );
    const passwordInput = getByPlaceholderText('Password');
    fireEvent.changeText(passwordInput, 'correct-password');
    fireEvent(passwordInput, 'submitEditing');
    await waitFor(() => {
      expect(
        getByTestId(RevealSeedViewSelectorsIDs.REVEAL_CREDENTIAL_MODAL_ID),
      ).toBeTruthy();
    });
    expect(mockVerifyPassword).toHaveBeenCalledWith('correct-password');
    expect(mockExportSeedPhrase).not.toHaveBeenCalled();
  });

  it('renders with a custom selectedAddress', async () => {
    const mockInternalAccount: InternalAccount = {
      type: EthAccountType.Eoa,
      id: 'unique-account-id-1',
      address: '0x1234567890123456789012345678901234567890',
      options: {
        someOption: 'optionValue',
        anotherOption: 42,
      },
      scopes: [EthScope.Eoa],
      methods: [
        EthMethod.PersonalSign,
        EthMethod.SignTransaction,
        EthMethod.SignTypedDataV1,
        EthMethod.SignTypedDataV3,
        EthMethod.SignTypedDataV4,
      ],
      metadata: {
        name: 'Test Account',
        importTime: Date.now(),
        keyring: {
          type: KeyringTypes.hd,
        },
        nameLastUpdatedAt: Date.now(),
        snap: {
          id: 'npm:@metamask/test-snap',
          name: 'Test Snap',
          enabled: true,
        },
        lastSelected: Date.now(),
      },
    };

    const { toJSON } = renderWithProviders(
      <RevealPrivateCredential
        route={{
          key: 'RevealPrivateCredential',
          name: 'RevealPrivateCredential',
          params: {
            credentialName: PRIV_KEY_CREDENTIAL,
            selectedAccount: mockInternalAccount,
          },
        }}
        navigation={null}
        cancel={() => null}
        credentialName={PRIV_KEY_CREDENTIAL}
      />,
    );
    expect(toJSON()).toMatchSnapshot();
  });

  describe('reveal after password confirmation', () => {
    const mockAccount = {
      address: MOCK_ADDRESS,
    } as InternalAccount;

    const renderAndReveal = async ({
      credentialName,
      keyringId,
      selectedAccount,
    }: {
      credentialName: string;
      keyringId?: string;
      selectedAccount?: InternalAccount;
    }) => {
      const utils = renderWithProviders(
        <RevealPrivateCredential
          route={{
            key: 'RevealPrivateCredential',
            name: 'RevealPrivateCredential',
            params: { credentialName, keyringId, selectedAccount },
          }}
          navigation={null}
          cancel={() => null}
          credentialName={credentialName}
        />,
      );
      const passwordInput = utils.getByPlaceholderText('Password');
      fireEvent.changeText(passwordInput, 'correct-password');
      fireEvent(passwordInput, 'submitEditing');
      const revealButton = await waitFor(() =>
        utils.getByTestId(
          RevealSeedViewSelectorsIDs.REVEAL_CREDENTIAL_BUTTON_ID,
        ),
      );
      fireEvent.press(revealButton);
      return utils;
    };

    it('exports the SRP of the keyring passed in the route and displays it', async () => {
      const { getByTestId } = await renderAndReveal({
        credentialName: SRP_CREDENTIAL,
        keyringId: 'keyring-id-2',
      });

      await waitFor(() => {
        expect(
          getByTestId(RevealSeedViewSelectorsIDs.REVEAL_CREDENTIAL_TEXT),
        ).toHaveProperty('props.value', MOCK_MNEMONIC);
      });
      expect(mockExportSeedPhrase).toHaveBeenCalledTimes(1);
      expect(mockExportSeedPhrase).toHaveBeenCalledWith(
        'correct-password',
        'keyring-id-2',
      );
      expect(mockExportAccount).not.toHaveBeenCalled();
    });

    it('exports the SRP without a keyring id when none is passed', async () => {
      const { getByTestId } = await renderAndReveal({
        credentialName: SRP_CREDENTIAL,
      });

      await waitFor(() => {
        expect(
          getByTestId(RevealSeedViewSelectorsIDs.REVEAL_CREDENTIAL_TEXT),
        ).toHaveProperty('props.value', MOCK_MNEMONIC);
      });
      expect(mockExportSeedPhrase).toHaveBeenCalledWith(
        'correct-password',
        undefined,
      );
    });

    it('exports the private key of the selected account and displays it', async () => {
      const { getByTestId } = await renderAndReveal({
        credentialName: PRIV_KEY_CREDENTIAL,
        selectedAccount: mockAccount,
      });

      await waitFor(() => {
        expect(
          getByTestId(RevealSeedViewSelectorsIDs.REVEAL_CREDENTIAL_TEXT),
        ).toHaveProperty('props.value', MOCK_PRIVATE_KEY);
      });
      expect(mockExportAccount).toHaveBeenCalledTimes(1);
      expect(mockExportAccount).toHaveBeenCalledWith(
        'correct-password',
        MOCK_ADDRESS,
      );
      expect(mockExportSeedPhrase).not.toHaveBeenCalled();
    });

    it.each([
      {
        description: 'incorrect password',
        error: new Error('Invalid password'),
        isHardware: false,
        expectedMessage: 'Incorrect password',
      },
      {
        description: 'unexpected error',
        error: new Error('Something went wrong'),
        isHardware: false,
        expectedMessage: "Couldn't unlock your account. Please try again.",
      },
      {
        description: 'hardware account',
        error: new Error('Invalid password'),
        isHardware: true,
        expectedMessage:
          'This is a hardware wallet account, you cannot export your private key.',
      },
    ])(
      'shows the $description message when the export fails',
      async ({ error, isHardware, expectedMessage }) => {
        mockIsHardwareAccount.mockReturnValue(isHardware);
        mockExportAccount.mockRejectedValue(error);

        const { getByTestId, queryByTestId } = await renderAndReveal({
          credentialName: PRIV_KEY_CREDENTIAL,
          selectedAccount: mockAccount,
        });

        await waitFor(() => {
          expect(
            getByTestId(RevealSeedViewSelectorsIDs.PASSWORD_WARNING_ID),
          ).toHaveProperty('props.children', expectedMessage);
        });
        expect(mockIsHardwareAccount).toHaveBeenCalledWith(MOCK_ADDRESS);
        expect(
          queryByTestId(RevealSeedViewSelectorsIDs.REVEAL_CREDENTIAL_TEXT),
        ).toBeNull();
      },
    );

    it('uses the localized error strings', () => {
      expect(strings('reveal_credential.warning_incorrect_password')).toBe(
        'Incorrect password',
      );
      expect(strings('reveal_credential.unknown_error')).toBe(
        "Couldn't unlock your account. Please try again.",
      );
      expect(strings('reveal_credential.hardware_error')).toBe(
        'This is a hardware wallet account, you cannot export your private key.',
      );
    });
  });

  describe('auto-unlock on mount', () => {
    const renderScreen = (credentialName: string, keyringId?: string) =>
      renderWithProviders(
        <RevealPrivateCredential
          route={{
            key: 'RevealPrivateCredential',
            name: 'RevealPrivateCredential',
            params: {
              credentialName,
              keyringId,
              selectedAccount: { address: MOCK_ADDRESS } as InternalAccount,
            },
          }}
          navigation={null}
          cancel={() => null}
          credentialName={credentialName}
        />,
      );

    it('unlocks with an empty password when no password is set', async () => {
      mockPasswordSet = false;
      const { getByTestId } = renderScreen(SRP_CREDENTIAL, 'keyring-id-2');

      await waitFor(() => {
        expect(
          getByTestId(RevealSeedViewSelectorsIDs.REVEAL_CREDENTIAL_TEXT),
        ).toHaveProperty('props.value', MOCK_MNEMONIC);
      });
      expect(mockExportSeedPhrase).toHaveBeenCalledWith('', 'keyring-id-2');
      expect(mockGetItem).not.toHaveBeenCalled();
      expect(mockGetPassword).not.toHaveBeenCalled();
    });

    it('unlocks with the biometric password when the biometry choice matches', async () => {
      mockGetType.mockResolvedValue({ availableBiometryType: 'FaceID' });
      mockGetItem.mockResolvedValue('FaceID');
      mockGetPassword.mockResolvedValue({ password: 'biometric-password' });
      const { getByTestId } = renderScreen(SRP_CREDENTIAL, 'keyring-id-2');

      await waitFor(() => {
        expect(
          getByTestId(RevealSeedViewSelectorsIDs.REVEAL_CREDENTIAL_TEXT),
        ).toHaveProperty('props.value', MOCK_MNEMONIC);
      });
      expect(mockGetItem).toHaveBeenCalledWith(BIOMETRY_CHOICE);
      expect(mockExportSeedPhrase).toHaveBeenCalledWith(
        'biometric-password',
        'keyring-id-2',
      );
      expect(mockExportAccount).not.toHaveBeenCalled();
    });

    it('exports the private key, not the SRP, when auto-unlocking a private key reveal', async () => {
      mockGetType.mockResolvedValue({ availableBiometryType: 'FaceID' });
      mockGetItem.mockResolvedValue('FaceID');
      mockGetPassword.mockResolvedValue({ password: 'biometric-password' });
      const { getByTestId } = renderScreen(PRIV_KEY_CREDENTIAL);

      await waitFor(() => {
        expect(
          getByTestId(RevealSeedViewSelectorsIDs.REVEAL_CREDENTIAL_TEXT),
        ).toHaveProperty('props.value', MOCK_PRIVATE_KEY);
      });
      expect(mockExportAccount).toHaveBeenCalledWith(
        'biometric-password',
        MOCK_ADDRESS,
      );
      expect(mockExportSeedPhrase).not.toHaveBeenCalled();
    });

    it.each([
      { description: 'differs', biometryChoice: 'TouchID' },
      { description: 'is empty', biometryChoice: '' },
      { description: 'is not stored', biometryChoice: null },
    ])(
      'does not unlock when the biometry choice $description',
      async ({ biometryChoice }) => {
        mockGetType.mockResolvedValue({ availableBiometryType: 'FaceID' });
        mockGetItem.mockResolvedValue(biometryChoice);
        mockGetPassword.mockResolvedValue({ password: 'biometric-password' });
        renderScreen(SRP_CREDENTIAL);

        await waitFor(() => {
          expect(mockGetItem).toHaveBeenCalledWith(BIOMETRY_CHOICE);
        });
        expect(mockGetPassword).not.toHaveBeenCalled();
        expect(mockExportSeedPhrase).not.toHaveBeenCalled();
        expect(mockExportAccount).not.toHaveBeenCalled();
      },
    );

    it('does not unlock when no biometry type is available', async () => {
      renderScreen(SRP_CREDENTIAL);

      await waitFor(() => {
        expect(mockGetType).toHaveBeenCalled();
      });
      expect(mockGetItem).not.toHaveBeenCalled();
      expect(mockGetPassword).not.toHaveBeenCalled();
      expect(mockExportSeedPhrase).not.toHaveBeenCalled();
    });

    it('does not unlock when no biometric credentials are stored', async () => {
      mockGetType.mockResolvedValue({ availableBiometryType: 'FaceID' });
      mockGetItem.mockResolvedValue('FaceID');
      mockGetPassword.mockResolvedValue(false);
      renderScreen(SRP_CREDENTIAL);

      await waitFor(() => {
        expect(mockGetPassword).toHaveBeenCalled();
      });
      expect(mockExportSeedPhrase).not.toHaveBeenCalled();
    });
  });
});
