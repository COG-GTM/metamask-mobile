import React from 'react';
import { act } from '@testing-library/react-native';

import renderWithProvider from '../../../util/test/renderWithProvider';
import QrScanner from './';
import { backgroundState } from '../../../util/test/initial-root-state';
import SharedDeeplinkManager from '../../../core/DeeplinkManager/SharedDeeplinkManager';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
let mockCameraProps: { onBarCodeRead: (r: { data: string }) => Promise<void> };

jest.mock('@react-navigation/native', () => {
  const actualReactNavigation = jest.requireActual('@react-navigation/native');
  return {
    ...actualReactNavigation,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: mockGoBack,
    }),
  };
});

jest.mock('react-native-camera', () => {
  const RNCamera = (props: typeof mockCameraProps) => {
    mockCameraProps = props;
    return null;
  };
  RNCamera.Constants = { Type: { back: 'back' }, FlashMode: { auto: 'auto' } };
  return { RNCamera };
});

jest.mock('../../../core/DeeplinkManager/SharedDeeplinkManager', () => ({
  __esModule: true,
  default: { parse: jest.fn(() => false) },
}));

jest.mock('../../../core/Engine', () => ({
  context: {
    KeyringController: { isUnlocked: () => true },
  },
}));

const KEY = 'a'.repeat(63) + 'b';

const scan = async (data: string) => {
  const onScanSuccess = jest.fn();
  renderWithProvider(<QrScanner onScanSuccess={onScanSuccess} />, {
    state: { engine: { backgroundState } },
  });
  await act(async () => {
    await mockCameraProps.onBarCodeRead({ data });
  });
  return onScanSuccess;
};

describe('QrScanner private key handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    ['0x-prefixed', `0x${KEY}`],
    ['0X-prefixed', `0X${KEY}`],
    ['unprefixed', KEY],
  ])(
    'imports a %s private key without passing it to the deeplink parser',
    async (_label, content) => {
      const onScanSuccess = await scan(content);

      expect(SharedDeeplinkManager.parse).not.toHaveBeenCalled();
      expect(onScanSuccess).toHaveBeenCalledWith({ private_key: KEY }, content);
    },
  );

  it('still offers non-key content to the deeplink parser', async () => {
    await scan('metamask://dapp/example.com');

    expect(SharedDeeplinkManager.parse).toHaveBeenCalledWith(
      'metamask://dapp/example.com',
      expect.objectContaining({ origin: 'qr-code' }),
    );
  });
});
