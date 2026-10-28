import React from 'react';
import { Button, View } from 'react-native';
import { act, fireEvent } from '@testing-library/react-native';
import renderWithProvider from '../../../util/test/renderWithProvider';
import QRSigningDetails from './QRSigningDetails';
import Engine from '../../../core/Engine';
import { IQRState } from './types';

jest.mock('../../../core/Engine', () => ({
  context: {
    KeyringController: {
      cancelQRSignRequest: jest.fn(() => Promise.resolve()),
      submitQRSignature: jest.fn(),
    },
  },
}));

type BeforeRemoveListener = (e: {
  preventDefault: () => void;
  data: { action: { type: string } };
}) => void;

const mockListeners: BeforeRemoveListener[] = [];
const mockUnsubscribes: jest.Mock[] = [];
const mockDispatch = jest.fn();
const mockNavigation = {
  addListener: jest.fn((_event: string, listener: BeforeRemoveListener) => {
    mockListeners.push(listener);
    const unsubscribe = jest.fn();
    mockUnsubscribes.push(unsubscribe);
    return unsubscribe;
  }),
  dispatch: mockDispatch,
};

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => mockNavigation,
}));

jest.mock('./AnimatedQRCode', () => () => null);
jest.mock('./AnimatedQRScanner', () => () => null);
jest.mock('../AccountInfoCard', () => () => null);

const MockButton = Button;
const MockView = View;
jest.mock('../ActionView', () => ({
  __esModule: true,
  default: ({
    cancelText,
    onCancelPress,
    children,
  }: {
    cancelText: string;
    onCancelPress: () => void;
    children: React.ReactNode;
  }) => (
    <MockView>
      <MockButton title={cancelText} onPress={onCancelPress} />
      {children}
    </MockView>
  ),
}));

const QRState = {
  sync: { reading: false },
  sign: {
    request: {
      requestId: 'c95ecc76-d6e9-4a0a-afa3-31429bc80566',
      payload: { type: 'eth-sign-request', cbor: 'a501' },
      title: 'Scan with your Keystone',
      description: 'Scan to sign',
    },
  },
} as unknown as IQRState;

const removeEvent = () => ({
  preventDefault: jest.fn(),
  data: { action: { type: 'GO_BACK' } },
});

describe('QRSigningDetails beforeRemove listener', () => {
  const { KeyringController } = Engine.context as unknown as {
    KeyringController: { cancelQRSignRequest: jest.Mock };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockListeners.length = 0;
    mockUnsubscribes.length = 0;
  });

  const renderDetails = () =>
    renderWithProvider(
      <QRSigningDetails
        QRState={QRState}
        fromAddress="0xc4955c0d639d99699bfd7ec54d9fafee40e4d272"
        bypassAndroidCameraAccessCheck
      />,
      { state: {} },
      false,
    );

  it('cancels the QR request before the screen is removed while signing is pending', async () => {
    renderDetails();
    expect(mockNavigation.addListener).toHaveBeenCalledTimes(1);

    const event = removeEvent();
    await act(async () => {
      mockListeners[0](event);
    });

    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(KeyringController.cancelQRSignRequest).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith(event.data.action);
  });

  it('removes the stale listener when the request is canceled and on unmount', async () => {
    const { getByText, unmount } = renderDetails();

    await act(async () => {
      fireEvent.press(getByText('Reject'));
    });

    expect(mockNavigation.addListener).toHaveBeenCalledTimes(2);
    expect(mockUnsubscribes[0]).toHaveBeenCalledTimes(1);
    expect(mockUnsubscribes[1]).not.toHaveBeenCalled();

    KeyringController.cancelQRSignRequest.mockClear();
    const event = removeEvent();
    mockListeners[1](event);
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(KeyringController.cancelQRSignRequest).not.toHaveBeenCalled();

    unmount();
    expect(mockUnsubscribes[1]).toHaveBeenCalledTimes(1);
  });
});
