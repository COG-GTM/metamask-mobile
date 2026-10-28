import React from 'react';
import { act } from '@testing-library/react-native';
import renderWithProvider from '../../../util/test/renderWithProvider';
import { backgroundState } from '../../../util/test/initial-root-state';
import { MOCK_ACCOUNTS_CONTROLLER_STATE } from '../../../util/test/accountsControllerTestUtils';
import BrowserTab from './BrowserTab';
import AppConstants from '../../../core/AppConstants';
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
      hostname: new URL(url).hostname,
      onMessage: jest.fn(),
      onDisconnect: jest.fn(),
      sendNotification: jest.fn(),
    };
    mockBridges.push(bridge);
    return bridge;
  }),
);

jest.mock('../../UI/AccountRightButton', () => () => null);

jest.mock('../../UI/UrlAutocomplete', () => {
  const { forwardRef, useImperativeHandle } = jest.requireActual('react');
  return {
    __esModule: true,
    default: forwardRef((_props: unknown, ref: unknown) => {
      useImperativeHandle(ref, () => ({
        search: jest.fn(),
        hide: jest.fn(),
        show: jest.fn(),
      }));
      return null;
    }),
  };
});

jest.mock('../../../util/browser/downloadFile', () =>
  jest.fn().mockResolvedValue(true),
);

jest.mock('../../../core/EntryScriptWeb3', () => ({
  get: jest.fn().mockResolvedValue('/* inpage provider */'),
}));

const BLOCKED_ORIGIN = 'https://phish.example';
jest.mock('../../../util/phishingDetection', () => ({
  ...jest.requireActual('../../../util/phishingDetection'),
  isProductSafetyDappScanningEnabled: () => false,
  getPhishingTestResult: () => ({ result: false }),
  getPhishingTestResultAsync: jest.fn(async (origin: string) => ({
    result: origin === 'https://phish.example',
    name: 'test',
  })),
}));

jest.mock('../../../core/Engine', () => ({
  context: {
    PhishingController: {
      maybeUpdateState: jest.fn(),
      test: () => ({ result: false }),
    },
    PermissionController: { state: { subjects: {} } },
  },
}));

const mockNavigation = {
  goBack: jest.fn(),
  goForward: jest.fn(),
  canGoBack: true,
  canGoForward: true,
  addListener: jest.fn(),
  setParams: jest.fn(),
  navigate: jest.fn(),
};

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => mockNavigation,
  useIsFocused: () => true,
}));

const mockInitialState = {
  browser: {
    activeTab: 1,
    whitelist: [],
    history: [],
    tabs: [{ id: 1, url: 'https://prize-drop.example' }],
  },
  engine: {
    backgroundState: {
      ...backgroundState,
      AccountsController: MOCK_ACCOUNTS_CONTROLLER_STATE,
    },
  },
  transaction: { selectedAsset: '' },
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
  initialUrl: 'https://prize-drop.example',
  homePageUrl: AppConstants.HOMEPAGE_URL,
};

const ATTACKER = 'https://prize-drop.example';
const TRUSTED = 'https://globex-swap.example';

const providerMessage = (method: string) =>
  JSON.stringify({
    name: 'metamask-provider',
    data: { id: 1, jsonrpc: '2.0', method },
  });

const renderWebView = async () => {
  const { findByTestId } = renderWithProvider(<BrowserTab {...mockProps} />, {
    state: mockInitialState,
  });
  return findByTestId(BrowserViewSelectorsIDs.BROWSER_WEBVIEW_ID);
};

describe('BrowserTab background bridge origin', () => {
  beforeEach(() => {
    mockBridges.length = 0;
    jest.clearAllMocks();
  });

  it('does not let a page talk to the bridge of a navigation that never committed', async () => {
    const webview = await renderWebView();
    const { onLoadStart, onMessage } = webview.props;

    // Attacker page loads and gets its own bridge
    await act(async () => {
      await onLoadStart({ nativeEvent: { url: `${ATTACKER}/` } });
    });
    act(() => {
      onMessage({
        nativeEvent: {
          url: `${ATTACKER}/`,
          frameUrl: `${ATTACKER}/`,
          isMainFrame: true,
          data: providerMessage('metamask_getProviderState'),
        },
      });
    });
    expect(mockBridges.map((b) => b.url)).toEqual([ATTACKER]);

    // Attacker starts a navigation to the trusted dapp that is later cancelled
    await act(async () => {
      await onLoadStart({ nativeEvent: { url: `${TRUSTED}/some-download` } });
    });
    expect(mockBridges.map((b) => b.url)).toEqual([ATTACKER]);

    // While provisional, WKWebView reports the target URL, but the frame is still the attacker's
    act(() => {
      onMessage({
        nativeEvent: {
          url: `${TRUSTED}/some-download`,
          frameUrl: `${ATTACKER}/`,
          isMainFrame: true,
          data: providerMessage('eth_accounts'),
        },
      });
    });
    // After the cancel, the WebView URL is back on the attacker page
    act(() => {
      onMessage({
        nativeEvent: {
          url: `${ATTACKER}/`,
          frameUrl: `${ATTACKER}/`,
          isMainFrame: true,
          data: providerMessage('eth_sendTransaction'),
        },
      });
    });

    expect(mockBridges.map((b) => b.url)).toEqual([ATTACKER]);
    expect(mockBridges[0].onMessage).toHaveBeenCalledTimes(3);
    expect(mockBridges[0].onDisconnect).not.toHaveBeenCalled();
  });

  it('re-keys the bridge once the navigated page itself posts a message', async () => {
    const webview = await renderWebView();
    const { onLoadStart, onMessage } = webview.props;

    await act(async () => {
      await onLoadStart({ nativeEvent: { url: `${ATTACKER}/` } });
    });
    act(() => {
      onMessage({
        nativeEvent: {
          url: `${ATTACKER}/`,
          frameUrl: `${ATTACKER}/`,
          isMainFrame: true,
          data: providerMessage('metamask_getProviderState'),
        },
      });
    });
    await act(async () => {
      await onLoadStart({ nativeEvent: { url: `${TRUSTED}/` } });
    });
    act(() => {
      onMessage({
        nativeEvent: {
          url: `${TRUSTED}/`,
          frameUrl: `${TRUSTED}/`,
          isMainFrame: true,
          data: providerMessage('metamask_getProviderState'),
        },
      });
    });

    expect(mockBridges.map((b) => b.url)).toEqual([ATTACKER, TRUSTED]);
    expect(mockBridges[0].onDisconnect).toHaveBeenCalledTimes(1);
    expect(mockBridges[1].onMessage).toHaveBeenCalledTimes(1);
  });

  it('drops messages from subframes and from blocked origins', async () => {
    const webview = await renderWebView();
    const { onLoadStart, onMessage } = webview.props;

    await act(async () => {
      await onLoadStart({ nativeEvent: { url: `${TRUSTED}/` } });
    });
    act(() => {
      onMessage({
        nativeEvent: {
          url: `${TRUSTED}/`,
          frameUrl: 'https://ads.example/frame',
          isMainFrame: false,
          data: providerMessage('eth_accounts'),
        },
      });
    });
    expect(mockBridges).toHaveLength(0);

    await act(async () => {
      await onLoadStart({ nativeEvent: { url: `${BLOCKED_ORIGIN}/` } });
    });
    act(() => {
      onMessage({
        nativeEvent: {
          url: `${BLOCKED_ORIGIN}/`,
          frameUrl: `${BLOCKED_ORIGIN}/`,
          isMainFrame: true,
          data: providerMessage('eth_accounts'),
        },
      });
    });
    expect(mockBridges).toHaveLength(0);
  });

  it('re-keys the bridge when the navigation to a new origin commits', async () => {
    const webview = await renderWebView();
    const { onLoadStart, onLoadEnd, onMessage } = webview.props;

    await act(async () => {
      await onLoadStart({ nativeEvent: { url: `${ATTACKER}/` } });
    });
    act(() => {
      onMessage({
        nativeEvent: {
          url: `${ATTACKER}/`,
          frameUrl: `${ATTACKER}/`,
          isMainFrame: true,
          data: providerMessage('metamask_getProviderState'),
        },
      });
    });
    await act(async () => {
      await onLoadStart({ nativeEvent: { url: `${TRUSTED}/` } });
    });
    expect(mockBridges.map((b) => b.url)).toEqual([ATTACKER]);

    await act(async () => {
      await onLoadEnd({
        nativeEvent: {
          url: `${TRUSTED}/`,
          title: 'Globex',
          canGoBack: true,
          canGoForward: false,
        },
      });
    });
    expect(mockBridges.map((b) => b.url)).toEqual([ATTACKER, TRUSTED]);
  });

  it('keeps the surviving page bridge when the navigation becomes a download', async () => {
    const webview = await renderWebView();
    const { onLoadStart, onMessage, onFileDownload } = webview.props;

    await act(async () => {
      await onLoadStart({ nativeEvent: { url: `${ATTACKER}/` } });
    });
    act(() => {
      onMessage({
        nativeEvent: {
          url: `${ATTACKER}/`,
          frameUrl: `${ATTACKER}/`,
          isMainFrame: true,
          data: providerMessage('metamask_getProviderState'),
        },
      });
    });
    await act(async () => {
      await onLoadStart({ nativeEvent: { url: `${TRUSTED}/some-download` } });
    });
    await act(async () => {
      await onFileDownload({
        nativeEvent: { downloadUrl: `${TRUSTED}/some-download` },
      });
    });

    // Without native frame info, the message claims to be from the trusted origin
    act(() => {
      onMessage({
        nativeEvent: {
          url: `${TRUSTED}/some-download`,
          data: providerMessage('eth_accounts'),
        },
      });
    });

    expect(mockBridges.map((b) => b.url)).toEqual([ATTACKER]);
    expect(mockBridges[0].onMessage).toHaveBeenCalledTimes(1);
  });
});
