import React from 'react';
import { Alert, Linking } from 'react-native';
import { screen } from '@testing-library/react-native';
import { WebView } from '@metamask/react-native-webview';
import renderWithProvider from '../../../../util/test/renderWithProvider';
import { backgroundState } from '../../../../util/test/initial-root-state';
import Checkout from './Checkout';

const mockSetOptions = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    setOptions: mockSetOptions,
    navigate: jest.fn(),
  }),
}));

jest.mock('../../Navbar', () => ({
  getFiatOnRampAggNavbar: jest.fn(() => ({})),
}));

jest.mock('../hooks/useAnalytics', () => () => jest.fn());
jest.mock('../hooks/useHandleSuccessfulOrder', () => () => jest.fn());

jest.mock('../sdk', () => ({
  useRampSDK: () => ({
    selectedAddress: '0x0000000000000000000000000000000000000001',
    selectedChainId: '1',
    sdkError: undefined,
    callbackBaseUrl:
      'https://on-ramp-content.api.cx.metamask.io/regions/fake-callback',
    isBuy: true,
  }),
  SDK: {},
}));

jest.mock('../../../../util/navigation/navUtils', () => ({
  ...jest.requireActual('../../../../util/navigation/navUtils'),
  useParams: () => ({
    url: 'https://provider.example/checkout',
    provider: { id: '/providers/payco', name: 'Payco', features: {} },
  }),
}));

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

describe('Checkout WebView navigation guard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
    jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderCheckout = () => {
    renderWithProvider(<Checkout />, {
      state: { engine: { backgroundState } },
    });
    return screen.UNSAFE_getByType(WebView);
  };

  it('routes every navigation through onShouldStartLoadWithRequest', () => {
    const webView = renderCheckout();
    expect(webView.props.source).toEqual({
      uri: 'https://provider.example/checkout',
    });
    expect(webView.props.originWhitelist).toEqual(['*']);
    expect(typeof webView.props.onShouldStartLoadWithRequest).toBe('function');
  });

  it('loads https provider pages and the callback URL', () => {
    const { onShouldStartLoadWithRequest } = renderCheckout().props;
    expect(
      onShouldStartLoadWithRequest({
        url: 'https://provider.example/kyc',
      }),
    ).toBe(true);
    expect(
      onShouldStartLoadWithRequest({
        url: 'https://on-ramp-content.api.cx.metamask.io/regions/fake-callback?orderId=1',
      }),
    ).toBe(true);
  });

  it.each(['metamask://buy?chainId=1', 'dapp://example.com', 'wc:abc@2'])(
    'blocks %s without leaving the checkout',
    async (url) => {
      const { onShouldStartLoadWithRequest } = renderCheckout().props;
      expect(onShouldStartLoadWithRequest({ url })).toBe(false);
      await flushPromises();
      expect(Alert.alert).not.toHaveBeenCalled();
      expect(Linking.openURL).not.toHaveBeenCalled();
    },
  );

  it('asks the user before opening tel: links', async () => {
    const { onShouldStartLoadWithRequest } = renderCheckout().props;
    expect(onShouldStartLoadWithRequest({ url: 'tel:123' })).toBe(false);
    await flushPromises();
    expect(Alert.alert).toHaveBeenCalledTimes(1);
    expect(Linking.openURL).not.toHaveBeenCalled();
  });
});
