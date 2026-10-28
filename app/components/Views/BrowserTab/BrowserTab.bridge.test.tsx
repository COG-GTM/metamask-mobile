import React from 'react';
import { act, waitFor } from '@testing-library/react-native';
import renderWithProvider from '../../../util/test/renderWithProvider';
import { backgroundState } from '../../../util/test/initial-root-state';
import { MOCK_ACCOUNTS_CONTROLLER_STATE } from '../../../util/test/accountsControllerTestUtils';
import AppConstants from '../../../core/AppConstants';
import { getPhishingTestResultAsync } from '../../../util/phishingDetection';
import BrowserTab from './BrowserTab';
import { BrowserViewSelectorsIDs } from '../../../../e2e/selectors/Browser/BrowserView.selectors';

interface MockBridge {
  url: string;
  onMessage: jest.Mock;
  onDisconnect: jest.Mock;
  sendNotification: jest.Mock;
}

const mockBridges: MockBridge[] = [];

jest.mock('../../../core/BackgroundBridge/BackgroundBridge', () =>
  jest.fn().mockImplementation(({ url }: { url: string }) => {
    const bridge = {
      url,
      onMessage: jest.fn(),
      onDisconnect: jest.fn(),
      sendNotification: jest.fn(),
    };
    mockBridges.push(bridge);
    return bridge;
  }),
);

// The URL bar and autocomplete need far more store state than this suite cares about
jest.mock('../../UI/BrowserUrlBar', () => {
  const { forwardRef } = jest.requireActual('react');
  return {
    ...jest.requireActual('../../UI/BrowserUrlBar/BrowserUrlBar.types'),
    __esModule: true,
    default: forwardRef(() => null),
  };
});

jest.mock('../../UI/UrlAutocomplete', () => {
  const { forwardRef } = jest.requireActual('react');
  return { __esModule: true, default: forwardRef(() => null) };
});

jest.mock('../../../core/EntryScriptWeb3', () => ({
  get: jest.fn().mockResolvedValue('entry-script'),
}));

jest.mock('../../../util/phishingDetection', () => ({
  getPhishingTestResult: jest.fn(() => ({ result: false })),
  getPhishingTestResultAsync: jest.fn(),
  isProductSafetyDappScanningEnabled: jest.fn(() => true),
}));

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      goBack: jest.fn(),
      goForward: jest.fn(),
      canGoBack: true,
      canGoForward: true,
      addListener: jest.fn(),
    }),
    useIsFocused: () => true,
  };
});

jest.mock('../../../core/Engine', () => ({
  context: {
    PhishingController: {
      maybeUpdateState: jest.fn(),
      test: () => ({ result: false }),
    },
  },
}));

const mockGetPhishingTestResultAsync =
  getPhishingTestResultAsync as jest.MockedFunction<
    typeof getPhishingTestResultAsync
  >;

const mockInitialState = {
  browser: { activeTab: 1, tabs: [], history: [], whitelist: [], favicons: [] },
  engine: {
    backgroundState: {
      ...backgroundState,
      AccountsController: MOCK_ACCOUNTS_CONTROLLER_STATE,
    },
  },
  transaction: {
    selectedAsset: '',
  },
};

const mockProps = {
  id: 1,
  activeTab: 1,
  defaultProtocol: 'https://',
  selectedAddress: '0x123',
  whitelist: [],
  bookmarks: [],
  searchEngine: 'Google',
  newTab: jest.fn(),
  addBookmark: jest.fn(),
  addToBrowserHistory: jest.fn(),
  addToWhitelist: jest.fn(),
  updateTabInfo: jest.fn(),
  showTabs: jest.fn(),
  setOnboardingWizardStep: jest.fn(),
  wizardStep: 1,
  isIpfsGatewayEnabled: false,
  chainId: '0x1',
  isInTabsView: false,
  initialUrl: 'https://metamask.io',
  homePageUrl: AppConstants.HOMEPAGE_URL,
};

const SAFE = { result: false } as Awaited<
  ReturnType<typeof getPhishingTestResultAsync>
>;

const renderWebView = async () => {
  const { getByTestId } = renderWithProvider(<BrowserTab {...mockProps} />, {
    state: mockInitialState,
  });
  const getWebView = () =>
    getByTestId(BrowserViewSelectorsIDs.BROWSER_WEBVIEW_ID);
  await waitFor(() => expect(getWebView()).toBeTruthy());
  return getWebView;
};

const providerMessage = (url: string, id: number) => ({
  nativeEvent: {
    url,
    data: JSON.stringify({
      name: 'metamask-provider',
      data: { id, method: 'eth_accounts' },
    }),
  },
});

describe('BrowserTab background bridge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBridges.length = 0;
  });

  it('does not install a bridge for a navigation superseded while its phishing check was pending', async () => {
    let resolveTrustedScan: (value: typeof SAFE) => void = () => undefined;
    mockGetPhishingTestResultAsync.mockImplementation((origin: string) =>
      origin === 'https://swap.example'
        ? new Promise((resolve) => {
            resolveTrustedScan = resolve;
          })
        : Promise.resolve(SAFE),
    );
    const getWebView = await renderWebView();

    let trustedLoadStart: Promise<unknown> = Promise.resolve();
    await act(async () => {
      trustedLoadStart = getWebView().props.onLoadStart({
        nativeEvent: { url: 'https://swap.example/' },
      });
      await getWebView().props.onLoadStart({
        nativeEvent: { url: 'https://evil.example/landing' },
      });
    });
    await act(async () => {
      resolveTrustedScan(SAFE);
      await trustedLoadStart;
    });

    expect(mockBridges.map(({ url }) => url)).toEqual(['https://evil.example']);
  });

  it('only forwards provider messages from the page origin the bridge is bound to', async () => {
    mockGetPhishingTestResultAsync.mockResolvedValue(SAFE);
    const getWebView = await renderWebView();

    await act(async () => {
      await getWebView().props.onLoadStart({
        nativeEvent: { url: 'https://swap.example/' },
      });
    });
    const [bridge] = mockBridges;

    act(() => {
      getWebView().props.onMessage(providerMessage('https://evil.example/', 1));
    });
    expect(bridge.onMessage).not.toHaveBeenCalled();

    act(() => {
      getWebView().props.onMessage(
        providerMessage('https://swap.example/trade', 2),
      );
    });
    expect(bridge.onMessage).toHaveBeenCalledTimes(1);
    expect(bridge.onMessage).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ id: 2 }) }),
    );
  });

  it('delivers messages sent before the bridge exists once the bridge for that origin is created', async () => {
    let resolveScan: (value: typeof SAFE) => void = () => undefined;
    mockGetPhishingTestResultAsync.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveScan = resolve;
        }),
    );
    const getWebView = await renderWebView();

    let loadStart: Promise<unknown> = Promise.resolve();
    act(() => {
      loadStart = getWebView().props.onLoadStart({
        nativeEvent: { url: 'https://dapp.example/' },
      });
      getWebView().props.onMessage(providerMessage('https://dapp.example/', 1));
      getWebView().props.onMessage(
        providerMessage('https://other.example/', 2),
      );
    });
    await act(async () => {
      resolveScan(SAFE);
      await loadStart;
    });

    const [bridge] = mockBridges;
    expect(bridge.url).toBe('https://dapp.example');
    expect(bridge.onMessage).toHaveBeenCalledTimes(1);
    expect(bridge.onMessage).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ id: 1 }) }),
    );
  });
});
