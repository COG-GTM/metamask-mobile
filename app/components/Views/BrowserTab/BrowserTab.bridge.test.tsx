import React from 'react';
import { act, waitFor } from '@testing-library/react-native';
import renderWithProvider from '../../../util/test/renderWithProvider';
import { backgroundState } from '../../../util/test/initial-root-state';
import { MOCK_ACCOUNTS_CONTROLLER_STATE } from '../../../util/test/accountsControllerTestUtils';
import BrowserTab from './BrowserTab';
import AppConstants from '../../../core/AppConstants';
import Device from '../../../util/device';
import { BrowserViewSelectorsIDs } from '../../../../e2e/selectors/Browser/BrowserView.selectors';
import { getPhishingTestResultAsync } from '../../../util/phishingDetection';
import { BRIDGE_TOKEN_KEY } from './utils';

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

jest.mock('../../../util/phishingDetection', () => ({
  getPhishingTestResult: jest.fn(() => ({ result: false })),
  getPhishingTestResultAsync: jest.fn(),
  isProductSafetyDappScanningEnabled: jest.fn(() => true),
}));

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    goBack: jest.fn(),
    navigate: jest.fn(),
    addListener: jest.fn(),
  }),
  useIsFocused: () => true,
}));

jest.mock('../../../core/Engine', () => ({
  context: {
    PhishingController: {
      maybeUpdateState: jest.fn(),
      test: () => ({ result: false }),
    },
  },
}));

jest.mock('../../UI/AccountRightButton', () => () => null);
jest.mock('../../UI/UrlAutocomplete', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  const { forwardRef } = require('react');
  return { __esModule: true, default: forwardRef(() => null) };
});

const mockScanResult = getPhishingTestResultAsync as jest.Mock;

const TRUSTED_URL = 'https://trustedswap.example/';
const EVIL_URL = 'https://evil.example/';

const state = {
  browser: { activeTab: 1, whitelist: [], tabs: [] },
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
  initialUrl: TRUSTED_URL,
  homePageUrl: AppConstants.HOMEPAGE_URL,
};

const providerMessage = JSON.stringify({
  name: 'metamask-provider',
  data: { method: 'eth_sendTransaction' },
});

const renderWebView = async () => {
  const { findByTestId } = renderWithProvider(<BrowserTab {...props} />, {
    state,
  });
  const webview = await findByTestId(
    BrowserViewSelectorsIDs.BROWSER_WEBVIEW_ID,
  );
  return webview;
};

// The WebView mock renders a View; read the latest props on each call.
const loadStart = (
  webview: Awaited<ReturnType<typeof renderWebView>>,
  url: string,
) => webview.props.onLoadStart({ nativeEvent: { url } });

const message = (
  webview: Awaited<ReturnType<typeof renderWebView>>,
  url: string,
  data: string,
) => webview.props.onMessage({ nativeEvent: { url, data } });

const connectTrustedSite = async (
  webview: Awaited<ReturnType<typeof renderWebView>>,
) => {
  mockScanResult.mockResolvedValueOnce({ result: false });
  await act(async () => {
    await loadStart(webview, TRUSTED_URL);
  });
  const trustedBridge = mockBridges[mockBridges.length - 1];
  expect(trustedBridge.url).toBe('https://trustedswap.example');
  return trustedBridge;
};

describe('BrowserTab background bridge origin binding', () => {
  beforeEach(() => {
    mockBridges.length = 0;
    jest.spyOn(Device, 'isAndroid').mockReturnValue(false);
    mockScanResult.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('delivers messages from the bridged origin', async () => {
    const webview = await renderWebView();
    const trustedBridge = await connectTrustedSite(webview);

    message(webview, TRUSTED_URL, providerMessage);

    expect(trustedBridge.onMessage).toHaveBeenCalledTimes(1);
  });

  it('does not route a new origin to the previous bridge while the scan is pending', async () => {
    const webview = await renderWebView();
    const trustedBridge = await connectTrustedSite(webview);

    let resolveScan: (value: { result: boolean }) => void = () => undefined;
    mockScanResult.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveScan = resolve;
      }),
    );
    let pendingLoad: Promise<unknown> = Promise.resolve();
    act(() => {
      pendingLoad = loadStart(webview, EVIL_URL);
    });

    expect(trustedBridge.onDisconnect).toHaveBeenCalled();
    message(webview, EVIL_URL, providerMessage);
    expect(trustedBridge.onMessage).not.toHaveBeenCalled();

    await act(async () => {
      resolveScan({ result: false });
      await pendingLoad;
    });

    const evilBridge = mockBridges[mockBridges.length - 1];
    expect(evilBridge.url).toBe('https://evil.example');
    expect(trustedBridge.onMessage).not.toHaveBeenCalled();
  });

  it('keeps no bridge attached when the scan blocks the page', async () => {
    const webview = await renderWebView();
    const trustedBridge = await connectTrustedSite(webview);
    const bridgeCount = mockBridges.length;

    mockScanResult.mockResolvedValueOnce({ result: true, name: 'blocklist' });
    await act(async () => {
      await loadStart(webview, EVIL_URL);
    });

    expect(trustedBridge.onDisconnect).toHaveBeenCalled();
    expect(mockBridges).toHaveLength(bridgeCount);

    message(webview, EVIL_URL, providerMessage);
    message(webview, TRUSTED_URL, providerMessage);
    expect(trustedBridge.onMessage).not.toHaveBeenCalled();
  });

  it('drops messages whose sender origin does not match the bridge origin', async () => {
    const webview = await renderWebView();
    const trustedBridge = await connectTrustedSite(webview);

    message(webview, EVIL_URL, providerMessage);

    expect(trustedBridge.onMessage).not.toHaveBeenCalled();
  });

  it('ignores a stale scan result after a newer navigation', async () => {
    const webview = await renderWebView();
    await connectTrustedSite(webview);

    let resolveStale: (value: { result: boolean }) => void = () => undefined;
    mockScanResult.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveStale = resolve;
      }),
    );
    let staleLoad: Promise<unknown> = Promise.resolve();
    act(() => {
      staleLoad = loadStart(webview, EVIL_URL);
    });

    mockScanResult.mockResolvedValueOnce({ result: false });
    await act(async () => {
      await loadStart(webview, TRUSTED_URL);
    });
    const currentBridge = mockBridges[mockBridges.length - 1];
    expect(currentBridge.url).toBe('https://trustedswap.example');

    await act(async () => {
      resolveStale({ result: false });
      await staleLoad;
    });

    expect(mockBridges[mockBridges.length - 1]).toBe(currentBridge);
    expect(currentBridge.onDisconnect).not.toHaveBeenCalled();
  });

  describe('on Android', () => {
    beforeEach(() => {
      jest.spyOn(Device, 'isAndroid').mockReturnValue(true);
    });

    const getToken = (
      webview: Awaited<ReturnType<typeof renderWebView>>,
    ): string => {
      const script: string =
        webview.props.injectedJavaScriptBeforeContentLoaded;
      const match = script.match(
        new RegExp(`\\["${BRIDGE_TOKEN_KEY}"\\] = "([^"]+)"`),
      );
      if (!match) throw new Error('bridge token not injected');
      return match[1];
    };

    it('injects the bridge token script into the main frame', async () => {
      const webview = await renderWebView();
      expect(getToken(webview)).toEqual(expect.any(String));
    });

    it('accepts provider messages that carry the bridge token', async () => {
      const webview = await renderWebView();
      const trustedBridge = await connectTrustedSite(webview);

      message(
        webview,
        TRUSTED_URL,
        JSON.stringify({
          [BRIDGE_TOKEN_KEY]: getToken(webview),
          data: providerMessage,
        }),
      );

      expect(trustedBridge.onMessage).toHaveBeenCalledTimes(1);
    });

    it('drops messages posted directly to ReactNativeWebView (e.g. from iframes)', async () => {
      const webview = await renderWebView();
      const trustedBridge = await connectTrustedSite(webview);

      message(webview, TRUSTED_URL, providerMessage);
      message(
        webview,
        TRUSTED_URL,
        JSON.stringify({ [BRIDGE_TOKEN_KEY]: 'guess', data: providerMessage }),
      );

      expect(trustedBridge.onMessage).not.toHaveBeenCalled();
    });
  });
});
