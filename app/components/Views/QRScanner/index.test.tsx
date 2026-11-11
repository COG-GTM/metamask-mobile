import React from 'react';
import { RNCamera } from 'react-native-camera';
import { act } from '@testing-library/react-native';

import renderWithProvider from '../../../util/test/renderWithProvider';
import QrScanner from './';
import { backgroundState } from '../../../util/test/initial-root-state';
import SharedDeeplinkManager from '../../../core/DeeplinkManager/SharedDeeplinkManager';

jest.mock('../../../core/DeeplinkManager/SharedDeeplinkManager', () => ({
  __esModule: true,
  default: { parse: jest.fn(() => false) },
}));

jest.mock('../../../core/Engine', () => ({
  context: {
    KeyringController: { isUnlocked: () => true },
  },
}));

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actualReactNavigation = jest.requireActual('@react-navigation/native');
  return {
    ...actualReactNavigation,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: mockGoBack,
      pop: jest.fn(),
    }),
  };
});

const initialState = {
  engine: {
    backgroundState,
  },
};

describe('QrScanner', () => {
  it('render matches snapshot', () => {
    const { toJSON } = renderWithProvider(
      <QrScanner
        onScanSuccess={() => {
          //unused
        }}
      />,
      { state: initialState },
    );
    expect(toJSON()).toMatchSnapshot();
  });

  describe('private key scans', () => {
    const hexKey = 'ab'.repeat(32);

    const scan = async (data: string) => {
      const onScanSuccess = jest.fn();
      const { UNSAFE_getByType } = renderWithProvider(
        <QrScanner onScanSuccess={onScanSuccess} />,
        { state: initialState },
      );
      await act(async () => {
        await UNSAFE_getByType(RNCamera).props.onBarCodeRead({ data });
      });
      return onScanSuccess;
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it.each([
      ['bare 64 hex characters', hexKey, hexKey],
      ['0x prefixed key', `0x${hexKey}`, hexKey],
      ['0X prefixed key', `0X${hexKey.toUpperCase()}`, hexKey.toUpperCase()],
    ])(
      'returns a %s without passing it to the deeplink parser',
      async (_, content, privateKey) => {
        const onScanSuccess = await scan(content);

        expect(SharedDeeplinkManager.parse).not.toHaveBeenCalled();
        expect(onScanSuccess).toHaveBeenCalledWith(
          { private_key: privateKey },
          content,
        );
      },
    );

    it('still passes deeplinks to the deeplink parser', async () => {
      const content = 'metamask://connect?channelId=123';
      await scan(content);

      expect(SharedDeeplinkManager.parse).toHaveBeenCalledWith(
        content,
        expect.objectContaining({ origin: 'qr-code' }),
      );
    });
  });
});
