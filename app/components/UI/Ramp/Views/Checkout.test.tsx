import React from 'react';
import renderWithProvider from '../../../../util/test/renderWithProvider';

const mockSetOptions = jest.fn();
const mockPop = jest.fn();
const mockGetParent = jest.fn(() => ({ pop: mockPop }));

jest.mock('@react-navigation/native', () => {
  const actualReactNavigation = jest.requireActual(
    '@react-navigation/native',
  );
  return {
    ...actualReactNavigation,
    useNavigation: () => ({
      setOptions: mockSetOptions,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      dangerouslyGetParent: mockGetParent,
    }),
  };
});

jest.mock('@metamask/react-native-webview', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  return { WebView: (props: Record<string, unknown>) => <View {...props} /> };
});

const mockUseParams = jest.fn();
jest.mock('../../../../util/navigation/navUtils', () => ({
  createNavigationDetails: () => jest.fn(),
  useParams: () => mockUseParams(),
}));

const mockUseRampSDK = jest.fn();
jest.mock('../sdk', () => ({
  useRampSDK: () => mockUseRampSDK(),
  SDK: { orders: jest.fn() },
}));

jest.mock('../hooks/useAnalytics', () => () => jest.fn());

jest.mock('../hooks/useHandleSuccessfulOrder', () => () => jest.fn());

jest.mock('../../Navbar', () => ({
  getFiatOnRampAggNavbar: () => ({}),
}));

jest.mock('../components/ErrorView', () => 'ErrorView');
jest.mock('../components/ErrorViewWithReporting', () => 'ErrorViewWithReporting');

// eslint-disable-next-line import/first
import CheckoutWebView, { createCheckoutNavDetails } from './Checkout';

describe('Checkout', () => {
  beforeEach(() => {
    mockSetOptions.mockClear();
    mockPop.mockClear();
    mockUseParams.mockReset();
    mockUseRampSDK.mockReset();
    mockUseRampSDK.mockReturnValue({
      selectedAddress: '0xabc',
      selectedChainId: '1',
      sdkError: undefined,
      callbackBaseUrl: 'https://callback.example/',
      isBuy: true,
    });
  });

  it('exports a navigation detail creator', () => {
    expect(typeof createCheckoutNavDetails).toBe('function');
  });

  it('renders the webview when a uri is supplied', () => {
    mockUseParams.mockReturnValue({
      url: 'https://provider.example/pay',
      provider: { id: 'p-1', name: 'ProviderName' },
    });
    const { toJSON } = renderWithProvider(<CheckoutWebView />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders the SDK error view when sdkError is present', () => {
    mockUseRampSDK.mockReturnValue({
      selectedAddress: '0xabc',
      selectedChainId: '1',
      sdkError: new Error('SDK down'),
      callbackBaseUrl: 'https://callback.example/',
      isBuy: true,
    });
    mockUseParams.mockReturnValue({
      url: 'https://provider.example/pay',
      provider: { id: 'p-1', name: 'ProviderName' },
    });
    const { toJSON } = renderWithProvider(<CheckoutWebView />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders nothing when there is no uri', () => {
    mockUseParams.mockReturnValue({
      url: '',
      provider: { id: 'p-1', name: 'ProviderName' },
    });
    const { toJSON } = renderWithProvider(<CheckoutWebView />);
    expect(toJSON()).toBeNull();
  });
});
