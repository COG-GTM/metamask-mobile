import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import AccountApproval from '.';
import { backgroundState } from '../../../util/test/initial-root-state';
import renderWithProvider from '../../../util/test/renderWithProvider';
import { MOCK_ACCOUNTS_CONTROLLER_STATE } from '../../../util/test/accountsControllerTestUtils';
import { CommonSelectorsIDs } from '../../../../e2e/selectors/Common.selectors';
import SDKConnect from '../../../core/SDKConnect/SDKConnect';

jest.mock('../../../core/SDKConnect/SDKConnect', () => ({
  __esModule: true,
  default: {
    getInstance: jest.fn(() => ({
      getConnections: () => ({}),
      removeChannel: jest.fn(),
      invalidateChannel: jest.fn(),
    })),
  },
}));

jest.mock('react-native/Libraries/Linking/Linking', () => ({
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

jest.mock('../../../core/Engine', () => {
  const { MOCK_ACCOUNTS_CONTROLLER_STATE: mockAccountsControllerState } =
    jest.requireActual('../../../util/test/accountsControllerTestUtils');
  return {
    context: {
      PhishingController: {
        maybeUpdateState: jest.fn(),
        test: jest.fn((url: string) => {
          if (url === 'phishing.com') return { result: true };
          return { result: false };
        }),
        scanUrl: jest.fn((url: string) => {
          if (url === 'phishing.com') return { recommendedAction: 'BLOCK' };
          return { recommendedAction: 'NONE' };
        }),
      },
      KeyringController: {
        getAccountKeyringType: () => Promise.resolve('HD Key Tree'),
        state: {
          keyrings: [
            {
              accounts: ['0xC4966c0D659D99699BFD7EB54D8fafEE40e4a756'],
            },
          ],
          keyringsMetadata: [
            {
              id: '01JNG71B7GTWH0J1TSJY9891S0',
              name: '',
            },
          ],
        },
      },
      AccountsController: {
        ...mockAccountsControllerState,
        state: mockAccountsControllerState,
      },
    },
  };
});

const mockInitialState = {
  engine: {
    backgroundState: {
      ...backgroundState,
      AccountsController: {
        ...MOCK_ACCOUNTS_CONTROLLER_STATE,
        accounts: {
          '0xC4966c0D659D99699BFD7EB54D8fafEE40e4a756': {
            balance: '0x0',
            name: 'Account 1',
            address: '0xC4966c0D659D99699BFD7EB54D8fafEE40e4a756',
          },
        },
      },
      TokensController: {
        allTokens: {
          '0x1': {
            '0xc4966c0d659d99699bfd7eb54d8fafee40e4a756': [],
          },
        },
      },
    },
  },
};

describe('AccountApproval', () => {
  it('should render correctly', () => {
    const container = renderWithProvider(
      <AccountApproval
        currentPageInformation={{ icon: '', url: '', title: '' }}
      />,
      { state: mockInitialState },
    );

    expect(container).toMatchSnapshot();
  });

  it('should render a warning banner if the hostname is included in phishing list', async () => {
    const { findByText } = renderWithProvider(
      <AccountApproval
        currentPageInformation={{ icon: '', url: 'phishing.com', title: '' }}
      />,
      { state: mockInitialState },
    );
    // Need to await for the async phishing check to complete
    const warningText = await findByText('Deceptive site ahead');
    expect(warningText).toBeTruthy();
  });

  describe('QR code reconnection OTP', () => {
    const mockRemoveChannel = jest.fn();
    const otpPageInformation = {
      icon: '',
      url: 'https://dapp.example',
      title: 'Example dapp',
      origin: 'qr-code',
      reconnect: true,
      channelId: 'channel-1',
      otps: [42, 7, 13],
    };
    const metrics = {
      trackEvent: jest.fn(),
    };

    beforeEach(() => {
      jest.clearAllMocks();
      (SDKConnect.getInstance as jest.Mock).mockReturnValue({
        getConnections: () => ({}),
        removeChannel: mockRemoveChannel,
        invalidateChannel: jest.fn(),
      });
    });

    const renderOTP = (onConfirm: jest.Mock, onCancel: jest.Mock) =>
      renderWithProvider(
        <AccountApproval
          currentPageInformation={otpPageInformation}
          onConfirm={onConfirm}
          onCancel={onCancel}
          metrics={metrics}
          navigation={{ navigate: jest.fn() }}
        />,
        { state: mockInitialState },
      );

    it('shows the code choices and disables resume until one is picked', () => {
      const { getByText, getByTestId } = renderOTP(jest.fn(), jest.fn());

      expect(getByText('42')).toBeTruthy();
      expect(getByText('7')).toBeTruthy();
      expect(getByText('13')).toBeTruthy();
      expect(
        getByTestId(CommonSelectorsIDs.CONNECT_BUTTON).props.accessibilityState
          ?.disabled ??
          getByTestId(CommonSelectorsIDs.CONNECT_BUTTON).props.disabled,
      ).toBe(true);
    });

    it('passes the chosen code to onConfirm when the right code is picked', () => {
      const onConfirm = jest.fn();
      const onCancel = jest.fn();
      const { getByText, getByTestId } = renderOTP(onConfirm, onCancel);

      fireEvent.press(getByText('42'));
      fireEvent.press(getByTestId(CommonSelectorsIDs.CONNECT_BUTTON));

      expect(onConfirm).toHaveBeenCalledWith(undefined, { otpChoice: 42 });
      expect(onCancel).not.toHaveBeenCalled();
      expect(mockRemoveChannel).not.toHaveBeenCalled();
    });

    it('rejects and removes the channel when a wrong code is picked', () => {
      const onConfirm = jest.fn();
      const onCancel = jest.fn();
      const { getByText, getByTestId } = renderOTP(onConfirm, onCancel);

      fireEvent.press(getByText('7'));
      fireEvent.press(getByTestId(CommonSelectorsIDs.CONNECT_BUTTON));

      expect(onConfirm).not.toHaveBeenCalled();
      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(mockRemoveChannel).toHaveBeenCalledWith({
        channelId: 'channel-1',
        sendTerminate: true,
      });
    });
  });
});
