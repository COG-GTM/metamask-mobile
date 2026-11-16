import React from 'react';
import renderWithProvider from '../../../util/test/renderWithProvider';
import Engine from '../../../core/Engine';
import ConnectQRHardware from './index';
import { fireEvent } from '@testing-library/react-native';
import ReactNativeModal from 'react-native-modal';
import { QR_CONTINUE_BUTTON } from '../../../../wdio/screen-objects/testIDs/Components/ConnectQRHardware.testIds';
import { backgroundState } from '../../../util/test/initial-root-state';
import { act } from '@testing-library/react-hooks';
import PAGINATION_OPERATIONS from '../../../constants/pagination';
import AnimatedQRScannerModal from '../../UI/QRHardware/AnimatedQRScanner';
import { strings } from '../../../../locales/i18n';
import {
  ACCOUNT_SELECTOR_NEXT_BUTTON,
  ACCOUNT_SELECTOR_PREVIOUS_BUTTON,
} from '../../../../wdio/screen-objects/testIDs/Components/AccountSelector.testIds';

const mockedNavigate = jest.fn();

const mockPage0Accounts = [
  {
    address: '0x4x678901234567890123456789012345678901210',
    shortenedAddress: '0x4x678...01210',
    balance: '0x0',
    index: 0,
  },
  {
    address: '0xa1e359811322d97991e03f863a0c30c2cf029cd24',
    shortenedAddress: '0xa1e35...9cd24',
    balance: '0x0',
    index: 1,
  },
  {
    address: '0xc1e359811322d97991e03f863a0c30c2cf029ce22',
    shortenedAddress: '0xc1e35...9ce22',
    balance: '0x0',
    index: 2,
  },
  {
    address: '0xd0a1e359811322d97991e03f863a0c30c2cf029c1',
    shortenedAddress: '0xd0a1e...029c1',
    balance: '0x0',
    index: 3,
  },
  {
    address: '0x4a1e359811322d97991e03f863a0c30c2cf029c13',
    shortenedAddress: '0x4a1e3...29c13',
    balance: '0x0',
    index: 4,
  },
];

const mockPage1Accounts = [
  {
    address: '0x12345678901234567890123456789012345678902',
    shortenedAddress: '0x12345...78902',
    balance: '0x0',
    index: 5,
  },
  {
    address: '0x25678901234567890123456789012345678901231',
    shortenedAddress: '0x25678...01231',
    balance: '0x0',
    index: 6,
  },
  {
    address: '0x3b678901234567890123456789012345678901202',
    shortenedAddress: '0x3b678...01202',
    balance: '0x0',
    index: 7,
  },
  {
    address: '0x42345678901234567890123456789012345678904',
    shortenedAddress: '0x42345...78904',
    balance: '0x0',
    index: 8,
  },
  {
    address: '0x52345678901234567890123456789012345678904',
    shortenedAddress: '0x52345...78904',
    balance: '0x0',
    index: 9,
  },
];

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: mockedNavigate,
      setOptions: jest.fn(),
    }),
  };
});

jest.mock('../../../core/Engine', () => ({
  context: {
    KeyringController: {
      state: {
        keyrings: [],
      },
      getAccounts: jest.fn(),
      getOrAddQRKeyring: jest.fn(),
      withKeyring: (_selector: unknown, operation: (args: unknown) => void) =>
        operation({
          keyring: {
            cancelSync: jest.fn(),
            submitCryptoAccount: jest.fn(),
            submitCryptoHDKey: jest.fn(),
          },
          metadata: { id: '1234' },
        }),
      connectQRHardware: jest.fn(),
    },
    AccountTrackerController: {
      syncBalanceWithAddresses: jest.fn(),
    },
  },
  controllerMessenger: {
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
  },
}));
const MockEngine = jest.mocked(Engine);

const mockInitialState = {
  engine: {
    backgroundState: {
      ...backgroundState,
    },
  },
};

describe('ConnectQRHardware', () => {
  const mockKeyringController = MockEngine.context.KeyringController;
  mockKeyringController.connectQRHardware.mockImplementation((page) => {
    switch (page) {
      case PAGINATION_OPERATIONS.GET_NEXT_PAGE:
        return Promise.resolve(mockPage1Accounts);

      case PAGINATION_OPERATIONS.GET_PREVIOUS_PAGE:
        return Promise.resolve(mockPage0Accounts);

      default:
        // return account lists in first page.
        return Promise.resolve(mockPage0Accounts);
    }
  });

  const mockAccountTrackerController =
    MockEngine.context.AccountTrackerController;
  mockAccountTrackerController.syncBalanceWithAddresses.mockImplementation(
    (addresses) =>
      Promise.resolve(
        addresses.reduce(
          (acc: { [key: string]: { balance: string } }, address) => {
            acc[address] = {
              balance: '0x0',
            };
            return acc;
          },
          {},
        ),
      ),
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly to match snapshot', () => {
    mockKeyringController.getAccounts.mockResolvedValue([]);
    const wrapper = renderWithProvider(
      <ConnectQRHardware navigation={mockedNavigate} />,
      { state: mockInitialState },
    );

    expect(wrapper).toMatchSnapshot();
  });

  it('renders first page correctly when user clicks `continue` button', async () => {
    mockKeyringController.getAccounts.mockResolvedValue([]);

    const { getByTestId, getByText } = renderWithProvider(
      <ConnectQRHardware navigation={mockedNavigate} />,
      { state: mockInitialState },
    );

    const button = getByTestId(QR_CONTINUE_BUTTON);

    expect(button).toBeDefined();

    await act(async () => {
      fireEvent.press(button);
    });

    expect(mockKeyringController.connectQRHardware).toHaveBeenCalledTimes(1);
    expect(mockKeyringController.connectQRHardware).toHaveBeenCalledWith(
      PAGINATION_OPERATIONS.GET_FIRST_PAGE,
    );

    mockPage0Accounts.forEach((account) => {
      expect(getByText(account.shortenedAddress)).toBeDefined();
    });
  });

  it('renders next page correctly when user clicks `Next Page` button', async () => {
    mockKeyringController.getAccounts.mockResolvedValue([]);

    const { getByTestId, getByText } = renderWithProvider(
      <ConnectQRHardware navigation={mockedNavigate} />,
      { state: mockInitialState },
    );

    const button = getByTestId(QR_CONTINUE_BUTTON);
    expect(button).toBeDefined();

    await act(async () => {
      fireEvent.press(button);
    });

    const nextButton = getByTestId(ACCOUNT_SELECTOR_NEXT_BUTTON);
    expect(nextButton).toBeDefined();
    await act(async () => {
      fireEvent.press(nextButton);
    });

    expect(mockKeyringController.connectQRHardware).toHaveBeenCalledTimes(2);
    expect(mockKeyringController.connectQRHardware).toHaveBeenCalledWith(
      PAGINATION_OPERATIONS.GET_NEXT_PAGE,
    );

    mockPage1Accounts.forEach((account) => {
      expect(getByText(account.shortenedAddress)).toBeDefined();
    });
  });

  it('renders previous page correctly when user clicks `Previous Page` button', async () => {
    mockKeyringController.getAccounts.mockResolvedValue([]);

    const { getByTestId, getByText } = renderWithProvider(
      <ConnectQRHardware navigation={mockedNavigate} />,
      { state: mockInitialState },
    );

    const button = getByTestId(QR_CONTINUE_BUTTON);
    expect(button).toBeDefined();

    await act(async () => {
      fireEvent.press(button);
    });

    const nextButton = getByTestId(ACCOUNT_SELECTOR_NEXT_BUTTON);
    expect(nextButton).toBeDefined();
    await act(async () => {
      fireEvent.press(nextButton);
    });

    const prevButton = getByTestId(ACCOUNT_SELECTOR_PREVIOUS_BUTTON);
    expect(prevButton).toBeDefined();
    await act(async () => {
      fireEvent.press(prevButton);
    });

    expect(mockKeyringController.connectQRHardware).toHaveBeenCalledTimes(3);
    expect(mockKeyringController.connectQRHardware).toHaveBeenCalledWith(
      PAGINATION_OPERATIONS.GET_PREVIOUS_PAGE,
    );

    mockPage0Accounts.forEach((account) => {
      expect(getByText(account.shortenedAddress)).toBeDefined();
    });
  });
  describe('qrKeyringStateChange subscription', () => {
    const QR_KEYRING_STATE_CHANGE = 'KeyringController:qrKeyringStateChange';

    const getSubscribedHandler = () => {
      const call = MockEngine.controllerMessenger.subscribe.mock.calls.find(
        ([eventType]) => eventType === QR_KEYRING_STATE_CHANGE,
      );
      if (!call) {
        throw new Error(`No subscription to ${QR_KEYRING_STATE_CHANGE}`);
      }
      return call[1] as (state: { sync: { reading: boolean } }) => void;
    };

    const isScannerVisible = (
      root: ReturnType<typeof renderWithProvider>,
    ): boolean => {
      const scanner = root.UNSAFE_getByType(AnimatedQRScannerModal);
      // react-native-modal keeps its content mounted until the hide animation
      // finishes, so `isVisible` is what reflects the requested state.
      expect(
        scanner.findByType(ReactNativeModal as unknown as React.ElementType)
          .props.isVisible,
      ).toBe(scanner.props.visible);
      return scanner.props.visible;
    };

    beforeEach(() => {
      mockKeyringController.getAccounts.mockResolvedValue([]);
    });

    it('subscribes to qrKeyringStateChange on mount and ensures a QR keyring exists', () => {
      renderWithProvider(<ConnectQRHardware navigation={mockedNavigate} />, {
        state: mockInitialState,
      });

      expect(mockKeyringController.getOrAddQRKeyring).toHaveBeenCalledTimes(1);
      expect(MockEngine.controllerMessenger.subscribe).toHaveBeenCalledTimes(1);
      expect(MockEngine.controllerMessenger.subscribe).toHaveBeenCalledWith(
        QR_KEYRING_STATE_CHANGE,
        expect.any(Function),
      );
      expect(MockEngine.controllerMessenger.unsubscribe).not.toHaveBeenCalled();
    });

    it('shows the scanner when sync.reading becomes true and hides it when it becomes false', () => {
      const root = renderWithProvider(
        <ConnectQRHardware navigation={mockedNavigate} />,
        { state: mockInitialState },
      );
      const handler = getSubscribedHandler();
      const scannerHint = strings('connect_qr_hardware.hint_text').trim();

      expect(isScannerVisible(root)).toBe(false);
      expect(root.queryByText(scannerHint, { exact: false })).toBeNull();

      act(() => {
        handler({ sync: { reading: true } });
      });

      expect(isScannerVisible(root)).toBe(true);
      expect(root.getByText(scannerHint, { exact: false })).toBeDefined();

      act(() => {
        handler({ sync: { reading: false } });
      });

      expect(isScannerVisible(root)).toBe(false);
    });

    it('unsubscribes the same handler on unmount', () => {
      const { unmount } = renderWithProvider(
        <ConnectQRHardware navigation={mockedNavigate} />,
        { state: mockInitialState },
      );
      const handler = getSubscribedHandler();

      unmount();

      expect(MockEngine.controllerMessenger.unsubscribe).toHaveBeenCalledTimes(
        1,
      );
      expect(MockEngine.controllerMessenger.unsubscribe).toHaveBeenCalledWith(
        QR_KEYRING_STATE_CHANGE,
        handler,
      );
    });
  });
});
