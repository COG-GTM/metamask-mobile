import React from 'react';
import { Alert } from 'react-native';
import { RNCamera } from 'react-native-camera';
import { act } from '@testing-library/react-native';

import renderWithProvider from '../../../util/test/renderWithProvider';
import QrScanner from './';
import { backgroundState } from '../../../util/test/initial-root-state';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

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
});

describe('QrScanner dapp mode', () => {
  const MNEMONIC =
    'verb middle giant soon wage common wide tool gentle garlic issue nut';
  const PRIVATE_KEY =
    '4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318';

  const renderScanner = (dappOrigin?: string) => {
    const onScanSuccess = jest.fn();
    const onScanError = jest.fn();
    const utils = renderWithProvider(
      <QrScanner
        onScanSuccess={onScanSuccess}
        onScanError={onScanError}
        dappOrigin={dappOrigin}
      />,
      { state: initialState },
    );
    const scan = async (data: string) => {
      await act(async () => {
        await utils.UNSAFE_getByType(RNCamera).props.onBarCodeRead({ data });
      });
    };
    return { ...utils, onScanSuccess, onScanError, scan };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
  });

  it('shows the requesting origin', () => {
    const { getByText } = renderScanner('evil.example');
    expect(getByText('evil.example is requesting a QR code scan')).toBeTruthy();
  });

  it.each([
    ['mnemonic', MNEMONIC],
    ['private key', PRIVATE_KEY],
    ['WalletConnect URI', 'wc:abc@2?relay-protocol=irn&symKey=def'],
  ])('never passes a scanned %s to the dapp', async (_, content) => {
    const { scan, onScanSuccess, onScanError } = renderScanner('evil.example');

    await scan(content);

    expect(onScanSuccess).not.toHaveBeenCalled();
    expect(onScanError).toHaveBeenCalledWith('DAPP_SCAN_WALLET_ONLY_CONTENT');
    expect(JSON.stringify(onScanError.mock.calls)).not.toContain(content);
    expect(Alert.alert).toHaveBeenCalledWith(
      'QR code not shared',
      expect.stringContaining('evil.example'),
    );
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it('returns other content as raw text without classifying it', async () => {
    const { scan, onScanSuccess, onScanError } = renderScanner('evil.example');
    const content = 'https://example.com/some-ticket';

    await scan(content);

    expect(onScanSuccess).toHaveBeenCalledWith({ content }, content);
    expect(onScanError).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('still classifies a mnemonic for wallet-internal scans', async () => {
    const { scan, onScanSuccess } = renderScanner();

    await scan(MNEMONIC);

    expect(onScanSuccess).toHaveBeenCalledWith({ seed: MNEMONIC }, MNEMONIC);
  });
});
