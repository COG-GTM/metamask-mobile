import React from 'react';
import { act, fireEvent, waitFor } from '@testing-library/react-native';
import renderWithProvider from '../../../util/test/renderWithProvider';
import { backgroundState } from '../../../util/test/initial-root-state';
import { MOCK_ACCOUNTS_CONTROLLER_STATE } from '../../../util/test/accountsControllerTestUtils';
import BrowserTab from './BrowserTab';
import AppConstants from '../../../core/AppConstants';
import { BrowserViewSelectorsIDs } from '../../../../e2e/selectors/Browser/BrowserView.selectors';
import BackgroundBridge from '../../../core/BackgroundBridge/BackgroundBridge';
import { getRpcMethodMiddleware } from '../../../core/RPCMethods/RPCMethodMiddleware';

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      goBack: jest.fn(),
      navigate: jest.fn(),
      setParams: jest.fn(),
      setOptions: jest.fn(),
      addListener: jest.fn(),
    }),
    useIsFocused: () => true,
    useRoute: () => ({ params: {} }),
  };
});

jest.mock('../../../core/Engine', () => ({
  context: {
    PhishingController: {
      maybeUpdateState: jest.fn(),
      test: () => ({ result: false, name: 'test' }),
    },
    CurrencyRateController: { updateExchangeRate: jest.fn() },
    PermissionController: { state: { subjects: {} } },
  },
}));

jest.mock('../../../util/phishingDetection', () => ({
  getPhishingTestResult: () => ({ result: false }),
  getPhishingTestResultAsync: async () => ({ result: false }),
  isProductSafetyDappScanningEnabled: () => false,
}));

jest.mock('../../../core/EntryScriptWeb3', () => ({
  get: async () => '',
}));

jest.mock('../../../core/BackgroundBridge/BackgroundBridge', () =>
  jest.fn().mockImplementation(() => ({
    onDisconnect: jest.fn(),
    onMessage: jest.fn(),
    sendNotification: jest.fn(),
  })),
);

jest.mock('../../../core/RPCMethods/RPCMethodMiddleware', () => ({
  ...jest.requireActual('../../../core/RPCMethods/RPCMethodMiddleware'),
  getRpcMethodMiddleware: jest.fn(),
}));

const HOMEPAGE_URL = AppConstants.HOMEPAGE_URL;
const EVIL_URL = 'https://evil.example/';

const mockState = {
  browser: { activeTab: 1, tabs: [], history: [], whitelist: [] },
  bookmarks: [{ url: 'https://bookmarked.example', name: 'secret' }],
  engine: {
    backgroundState: {
      ...backgroundState,
      AccountsController: MOCK_ACCOUNTS_CONTROLLER_STATE,
    },
  },
  transaction: { selectedAsset: '' },
};

const props = {
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
  initialUrl: HOMEPAGE_URL,
  homePageUrl: HOMEPAGE_URL,
};

const MockBackgroundBridge = BackgroundBridge as unknown as jest.Mock;
const mockGetRpcMethodMiddleware = getRpcMethodMiddleware as jest.Mock;

/**
 * Builds the RPC middleware for the n-th bridge created by the tab and
 * returns the `isHomepage` check that the homepage-only methods use.
 */
const getBridgeIsHomepage = (bridgeIndex: number) => {
  const { getRpcMethodMiddleware: createMiddleware, url } =
    MockBackgroundBridge.mock.calls[bridgeIndex][0];
  mockGetRpcMethodMiddleware.mockClear();
  createMiddleware({
    hostname: new URL(url).hostname,
    getProviderState: jest.fn(),
  });
  return mockGetRpcMethodMiddleware.mock.calls[0][0].isHomepage as () => boolean;
};

const navigationEvent = (url: string) => ({
  nativeEvent: {
    url,
    title: url,
    canGoBack: false,
    canGoForward: false,
    loading: false,
  },
});

describe('BrowserTab homepage privileges', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderTab = async () => {
    const utils = renderWithProvider(<BrowserTab {...props} />, {
      state: mockState,
    });
    const webview = await utils.findByTestId(
      BrowserViewSelectorsIDs.BROWSER_WEBVIEW_ID,
    );
    return { ...utils, webview };
  };

  const loadStart = async (webview: unknown, url: string, bridges: number) => {
    await act(async () => {
      fireEvent(webview as never, 'loadStart', navigationEvent(url));
    });
    await waitFor(() =>
      expect(MockBackgroundBridge).toHaveBeenCalledTimes(bridges),
    );
  };

  const loadEnd = async (webview: unknown, url: string) => {
    await act(async () => {
      fireEvent(webview as never, 'loadEnd', navigationEvent(url));
    });
  };

  it('grants homepage methods to the homepage bridge', async () => {
    const { webview } = await renderTab();
    await loadStart(webview, HOMEPAGE_URL, 1);
    const homepageIsHomepage = getBridgeIsHomepage(0);

    expect(homepageIsHomepage()).toBe(true);
    await loadEnd(webview, HOMEPAGE_URL);
    expect(homepageIsHomepage()).toBe(true);
  });

  it('denies homepage methods to a site still loading after the homepage', async () => {
    const { webview } = await renderTab();
    await loadStart(webview, HOMEPAGE_URL, 1);
    await loadEnd(webview, HOMEPAGE_URL);
    const homepageIsHomepage = getBridgeIsHomepage(0);

    // evil.example starts loading but never finishes (hanging resource), so
    // the tab's last resolved URL is still the homepage
    await loadStart(webview, EVIL_URL, 2);
    const evilIsHomepage = getBridgeIsHomepage(1);

    expect(evilIsHomepage()).toBe(false);
    // A stale homepage bridge must not answer for the new page either
    expect(homepageIsHomepage()).toBe(false);
  });

  it('denies homepage methods to http homepage hosts', async () => {
    const { webview } = await renderTab();
    await loadStart(webview, HOMEPAGE_URL, 1);
    await loadEnd(webview, HOMEPAGE_URL);

    await loadStart(webview, 'http://home.metamask.io/', 2);
    expect(getBridgeIsHomepage(1)()).toBe(false);
    await loadEnd(webview, 'http://home.metamask.io/');
    expect(getBridgeIsHomepage(1)()).toBe(false);
  });
});
