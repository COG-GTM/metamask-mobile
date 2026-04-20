import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import CookieManager from '@react-native-cookies/cookies';
import renderWithProvider from '../../../../../util/test/renderWithProvider';
import { backgroundState } from '../../../../../util/test/initial-root-state';
import ClearCookiesSection from './ClearCookiesSection';
import Device from '../../../../../util/device';

jest.mock('@metamask/react-native-button', () => 'MetaMaskButton');

jest.mock('../../../../UI/ActionModal', () => {
  const ReactLib = jest.requireActual('react');
  const { View, Text, TouchableOpacity } = jest.requireActual('react-native');
  return ({
    modalVisible,
    onConfirmPress,
    onCancelPress,
    children,
  }: {
    modalVisible: boolean;
    onConfirmPress: () => void;
    onCancelPress: () => void;
    children: React.ReactNode;
  }) => {
    if (!modalVisible) return null;
    return ReactLib.createElement(
      View,
      { testID: 'action-modal' },
      children,
      ReactLib.createElement(
        TouchableOpacity,
        { testID: 'action-modal-confirm', onPress: onConfirmPress },
        ReactLib.createElement(Text, null, 'Confirm'),
      ),
      ReactLib.createElement(
        TouchableOpacity,
        { testID: 'action-modal-cancel', onPress: onCancelPress },
        ReactLib.createElement(Text, null, 'Cancel'),
      ),
    );
  };
});

jest.mock('@react-native-cookies/cookies', () => ({
  __esModule: true,
  default: {
    getAll: jest.fn(),
    clearAll: jest.fn(),
  },
}));

jest.mock('../../../../../util/device', () => ({
  isAndroid: jest.fn(() => false),
  isIos: jest.fn(() => true),
}));

jest.mock('../../../../../util/Logger', () => ({
  log: jest.fn(),
  error: jest.fn(),
}));

const initialState = { engine: { backgroundState } };

describe('ClearCookiesSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Device.isAndroid as jest.Mock).mockReturnValue(false);
    (Device.isIos as jest.Mock).mockReturnValue(true);
    (CookieManager.getAll as jest.Mock).mockResolvedValue({});
    (CookieManager.clearAll as jest.Mock).mockResolvedValue(undefined);
  });

  it('renders correctly', async () => {
    const { toJSON } = renderWithProvider(<ClearCookiesSection />, {
      state: initialState,
    });
    await waitFor(() => expect(CookieManager.getAll).toHaveBeenCalled());
    expect(toJSON()).toMatchSnapshot();
  });

  it('queries cookies on iOS', async () => {
    (CookieManager.getAll as jest.Mock).mockResolvedValue({
      'example.com': { name: 'session', value: 'abc' },
    });

    renderWithProvider(<ClearCookiesSection />, { state: initialState });

    await waitFor(() =>
      expect(CookieManager.getAll).toHaveBeenCalledWith(true),
    );
  });

  it('calls CookieManager.clearAll when the modal is confirmed', async () => {
    (CookieManager.getAll as jest.Mock)
      .mockResolvedValueOnce({
        'example.com': { name: 'session', value: 'abc' },
      })
      .mockResolvedValueOnce({});

    const { getByTestId, UNSAFE_root } = renderWithProvider(
      <ClearCookiesSection />,
      { state: initialState },
    );

    await waitFor(() => expect(CookieManager.getAll).toHaveBeenCalled());

    const buttons = UNSAFE_root.findAllByProps({ isDisabled: false });
    const enabledButton = buttons.find(
      (node) => typeof node.props.onPress === 'function',
    );
    if (!enabledButton) throw new Error('clear cookies button not found');
    fireEvent.press(enabledButton);

    fireEvent.press(getByTestId('action-modal-confirm'));

    await waitFor(() =>
      expect(CookieManager.clearAll).toHaveBeenCalledWith(true),
    );
  });

  it('treats Android as having cookies without querying CookieManager', async () => {
    (Device.isAndroid as jest.Mock).mockReturnValue(true);
    (Device.isIos as jest.Mock).mockReturnValue(false);

    renderWithProvider(<ClearCookiesSection />, { state: initialState });

    await waitFor(() => {
      expect(CookieManager.getAll).not.toHaveBeenCalled();
    });
  });
});
