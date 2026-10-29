import React from 'react';
import { act, screen } from '@testing-library/react-native';
import renderWithProvider from '../../../util/test/renderWithProvider';
import { backgroundState } from '../../../util/test/initial-root-state';
import { MOCK_ACCOUNTS_CONTROLLER_STATE } from '../../../util/test/accountsControllerTestUtils';
import BrowserTab from './BrowserTab';
import AppConstants from '../../../core/AppConstants';
import { getPhishingTestResultAsync } from '../../../util/phishingDetection';
import { addToWhitelist } from '../../../actions/browser';

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

// These libraries read Text.propTypes, which react-native 0.76 no longer defines
jest.mock('@metamask/react-native-button', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  const { View } = require('react-native');
  return View;
});
jest.mock('react-native-material-textfield', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  const { View } = require('react-native');
  return { OutlinedTextField: View, TextField: View, FilledTextField: View };
});

jest.mock('../../UI/OnboardingWizard', () => () => null);
jest.mock('../../UI/AccountRightButton', () => () => null);
jest.mock('../../UI/UrlAutocomplete', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  const { forwardRef } = require('react');
  return {
    ...jest.requireActual('../../UI/UrlAutocomplete'),
    __esModule: true,
    default: forwardRef(() => null),
  };
});
jest.mock('react-native-qrcode-svg', () => () => null);

jest.mock('../../../core/EntryScriptWeb3', () => ({
  get: jest.fn(() => Promise.resolve('entry-script')),
}));

jest.mock('../../../util/phishingDetection', () => ({
  ...jest.requireActual('../../../util/phishingDetection'),
  getPhishingTestResultAsync: jest.fn(),
  isProductSafetyDappScanningEnabled: jest.fn(() => false),
}));

const mockNavigation = {
  goBack: jest.fn(),
  goForward: jest.fn(),
  canGoBack: true,
  canGoForward: true,
  addListener: jest.fn(),
  navigate: jest.fn(),
  setParams: jest.fn(),
};

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => mockNavigation,
    useIsFocused: () => true,
  };
});

jest.mock('../../../core/Engine', () => ({
  context: {
    PhishingController: {
      maybeUpdateState: jest.fn(),
      test: () => ({ result: false, name: 'test' }),
    },
    PermissionController: {
      state: { subjects: {} },
    },
  },
}));

const mockGetPhishingTestResultAsync =
  getPhishingTestResultAsync as jest.MockedFunction<
    typeof getPhishingTestResultAsync
  >;

const ORIGIN_A = 'https://dapp-a.example';
const ORIGIN_B = 'https://dapp-b.example';
const ATTACKER = 'https://attacker.example';

const mockInitialState = {
  browser: {
    activeTab: 1,
    tabs: [{ id: 1, url: 'https://dapp-a.example/' }],
    history: [],
    whitelist: [],
    favicons: [],
  },
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
  initialUrl: `${ORIGIN_A}/`,
  homePageUrl: AppConstants.HOMEPAGE_URL,
};

const providerMessage = { name: 'metamask-provider', data: { id: 1 } };

const deferred = () => {
  let resolve: (value: { result: boolean; name: string }) => void = () =>
    undefined;
  const promise = new Promise<{ result: boolean; name: string }>((res) => {
    resolve = res;
  });
  return { promise, resolve };
};

let mockStore: ReturnType<typeof renderWithProvider>['store'];

const renderWebView = async () => {
  ({ store: mockStore } = renderWithProvider(<BrowserTab {...mockProps} />, {
    state: mockInitialState,
  }));
  return screen.findByTestId('browser-webview');
};

// Fires onLoadStart and returns its pending phishing check without awaiting it
const startLoad = (
  webview: ReturnType<typeof screen.getByTestId>,
  url: string,
): Promise<unknown> => {
  let pending: Promise<unknown> = Promise.resolve();
  act(() => {
    pending = webview.props.onLoadStart({
      nativeEvent: { url, title: '', loading: true },
    });
  });
  return pending;
};

const loadStart = async (
  webview: ReturnType<typeof screen.getByTestId>,
  url: string,
) => {
  await act(async () => {
    await startLoad(webview, url);
  });
};

const postMessage = (
  webview: ReturnType<typeof screen.getByTestId>,
  sender: { frameOrigin?: string; isMainFrame?: boolean },
  message: Record<string, unknown> = providerMessage,
) => {
  act(() => {
    webview.props.onMessage({
      nativeEvent: { data: JSON.stringify(message), ...sender },
    });
  });
};

const forwardedMessageCount = () =>
  mockBridges.reduce(
    (count, bridge) => count + bridge.onMessage.mock.calls.length,
    0,
  );

describe('BrowserTab background bridge origin binding', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBridges.length = 0;
    mockGetPhishingTestResultAsync.mockResolvedValue({
      result: false,
      name: 'test',
    } as Awaited<ReturnType<typeof getPhishingTestResultAsync>>);
  });

  it('binds the bridge to the sender origin and forwards same-origin main frame messages', async () => {
    const webview = await renderWebView();
    await loadStart(webview, `${ORIGIN_A}/page`);

    postMessage(webview, { frameOrigin: ORIGIN_A, isMainFrame: true });

    expect(mockBridges).toHaveLength(1);
    expect(mockBridges[0].url).toBe(ORIGIN_A);
    expect(mockBridges[0].onMessage).toHaveBeenCalledWith(providerMessage);
  });

  it('drops messages from iframes, other origins, and senders without native frame info', async () => {
    const webview = await renderWebView();
    await loadStart(webview, `${ORIGIN_A}/page`);

    postMessage(webview, { frameOrigin: ATTACKER, isMainFrame: false });
    postMessage(webview, { frameOrigin: ORIGIN_A, isMainFrame: false });
    postMessage(webview, { frameOrigin: ATTACKER, isMainFrame: true });
    postMessage(webview, {});
    postMessage(webview, { frameOrigin: 'null', isMainFrame: true });

    expect(forwardedMessageCount()).toBe(0);
    expect(mockBridges).toHaveLength(0);
  });

  it('tears down the previous bridge as soon as a new navigation starts', async () => {
    const webview = await renderWebView();
    await loadStart(webview, `${ORIGIN_A}/page`);
    postMessage(webview, { frameOrigin: ORIGIN_A, isMainFrame: true });
    const oldBridge = mockBridges[0];

    const check = deferred();
    mockGetPhishingTestResultAsync.mockReturnValueOnce(
      check.promise as ReturnType<typeof getPhishingTestResultAsync>,
    );
    const pending = startLoad(webview, `${ORIGIN_B}/page`);

    expect(oldBridge.onDisconnect).toHaveBeenCalled();
    oldBridge.onMessage.mockClear();

    // Neither the old origin nor the pending origin may use a bridge while the check is in flight
    postMessage(webview, { frameOrigin: ORIGIN_A, isMainFrame: true });
    postMessage(webview, { frameOrigin: ORIGIN_B, isMainFrame: true });
    expect(forwardedMessageCount()).toBe(0);
    expect(mockBridges).toHaveLength(1);

    await act(async () => {
      check.resolve({ result: false, name: 'test' });
      await pending;
    });

    // Held message from the approved origin is replayed to a bridge keyed to it; the old origin's is dropped
    expect(mockBridges).toHaveLength(2);
    expect(mockBridges[1].url).toBe(ORIGIN_B);
    expect(mockBridges[1].onMessage).toHaveBeenCalledTimes(1);
    expect(oldBridge.onMessage).not.toHaveBeenCalled();
  });

  it('ignores a stale phishing check that resolves after a newer navigation started', async () => {
    const webview = await renderWebView();

    const staleCheck = deferred();
    mockGetPhishingTestResultAsync.mockReturnValueOnce(
      staleCheck.promise as ReturnType<typeof getPhishingTestResultAsync>,
    );
    const stalePending = startLoad(webview, `${ORIGIN_A}/page`);
    await loadStart(webview, `${ORIGIN_B}/page`);
    await act(async () => {
      staleCheck.resolve({ result: false, name: 'test' });
      await stalePending;
    });

    postMessage(webview, { frameOrigin: ORIGIN_A, isMainFrame: true });
    expect(forwardedMessageCount()).toBe(0);

    postMessage(webview, { frameOrigin: ORIGIN_B, isMainFrame: true });
    expect(mockBridges).toHaveLength(1);
    expect(mockBridges[0].url).toBe(ORIGIN_B);
    expect(mockBridges[0].onMessage).toHaveBeenCalledTimes(1);
  });

  it('never binds a bridge to a navigation blocked by the phishing check', async () => {
    const webview = await renderWebView();
    mockGetPhishingTestResultAsync.mockResolvedValueOnce({
      result: true,
      name: 'blocklist',
    } as Awaited<ReturnType<typeof getPhishingTestResultAsync>>);
    await loadStart(webview, `${ATTACKER}/page`);

    postMessage(webview, { frameOrigin: ATTACKER, isMainFrame: true });

    expect(mockBridges).toHaveLength(0);
  });

  it('re-keys the bridge to the committed origin after a redirect', async () => {
    const webview = await renderWebView();
    await loadStart(webview, `${ORIGIN_A}/page`);
    postMessage(webview, { frameOrigin: ORIGIN_A, isMainFrame: true });
    const preRedirectBridge = mockBridges[0];

    await act(async () => {
      webview.props.onLoadEnd({
        nativeEvent: {
          url: `${ORIGIN_B}/landing`,
          title: '',
          loading: false,
          canGoBack: true,
          canGoForward: false,
        },
      });
    });

    expect(preRedirectBridge.onDisconnect).toHaveBeenCalled();
    postMessage(webview, { frameOrigin: ORIGIN_A, isMainFrame: true });
    postMessage(webview, { frameOrigin: ORIGIN_B, isMainFrame: true });
    expect(mockBridges).toHaveLength(2);
    expect(mockBridges[1].url).toBe(ORIGIN_B);
    expect(mockBridges[1].onMessage).toHaveBeenCalledTimes(1);
    expect(preRedirectBridge.onMessage).toHaveBeenCalledTimes(1);
  });

  it('keeps the committed redirect origin when the original load-start check resolves late', async () => {
    const webview = await renderWebView();

    const originalCheck = deferred();
    mockGetPhishingTestResultAsync.mockReturnValueOnce(
      originalCheck.promise as ReturnType<typeof getPhishingTestResultAsync>,
    );
    const originalPending = startLoad(webview, `${ORIGIN_A}/page`);
    // The redirected document's provider starts sending before its load end
    postMessage(webview, { frameOrigin: ORIGIN_B, isMainFrame: true });

    await act(async () => {
      webview.props.onLoadEnd({
        nativeEvent: {
          url: `${ORIGIN_B}/landing`,
          title: '',
          loading: false,
          canGoBack: true,
          canGoForward: false,
        },
      });
    });
    await act(async () => {
      originalCheck.resolve({ result: false, name: 'test' });
      await originalPending;
    });

    postMessage(webview, { frameOrigin: ORIGIN_A, isMainFrame: true });
    postMessage(webview, { frameOrigin: ORIGIN_B, isMainFrame: true });
    expect(mockBridges).toHaveLength(1);
    expect(mockBridges[0].url).toBe(ORIGIN_B);
    expect(mockBridges[0].onMessage).toHaveBeenCalledTimes(2);
  });

  it('does not keep the previous origin approved while a redirect is being checked', async () => {
    const webview = await renderWebView();
    await loadStart(webview, `${ORIGIN_A}/page`);

    const redirectCheck = deferred();
    mockGetPhishingTestResultAsync.mockReturnValueOnce(
      redirectCheck.promise as ReturnType<typeof getPhishingTestResultAsync>,
    );
    act(() => {
      webview.props.onLoadEnd({
        nativeEvent: {
          url: `${ORIGIN_B}/landing`,
          title: '',
          loading: false,
          canGoBack: true,
          canGoForward: false,
        },
      });
    });

    postMessage(webview, { frameOrigin: ORIGIN_A, isMainFrame: true });
    expect(mockBridges).toHaveLength(0);

    await act(async () => {
      redirectCheck.resolve({ result: false, name: 'test' });
    });
    expect(mockBridges).toHaveLength(0);
  });

  it('re-keys the bridge after a back/forward navigation without load events', async () => {
    const webview = await renderWebView();
    await loadStart(webview, `${ORIGIN_B}/page`);
    postMessage(webview, { frameOrigin: ORIGIN_B, isMainFrame: true });
    const previousBridge = mockBridges[0];

    await act(async () => {
      webview.props.onNavigationStateChange({
        url: `${ORIGIN_A}/page`,
        title: '',
        loading: false,
        canGoBack: false,
        canGoForward: true,
        navigationType: 'backforward',
      });
    });

    expect(previousBridge.onDisconnect).toHaveBeenCalled();
    postMessage(webview, { frameOrigin: ORIGIN_A, isMainFrame: true });
    expect(mockBridges).toHaveLength(2);
    expect(mockBridges[1].url).toBe(ORIGIN_A);
    expect(mockBridges[1].onMessage).toHaveBeenCalledTimes(1);
  });

  it('never binds a bridge to a phishing-blocked page reached via back/forward', async () => {
    const webview = await renderWebView();
    await loadStart(webview, `${ORIGIN_A}/page`);
    postMessage(webview, { frameOrigin: ORIGIN_A, isMainFrame: true });
    const previousBridge = mockBridges[0];

    mockGetPhishingTestResultAsync.mockResolvedValue({
      result: true,
      name: 'blocklist',
    } as Awaited<ReturnType<typeof getPhishingTestResultAsync>>);
    await act(async () => {
      webview.props.onNavigationStateChange({
        url: `${ATTACKER}/page`,
        title: '',
        loading: false,
        canGoBack: false,
        canGoForward: true,
        navigationType: 'backforward',
      });
    });
    await act(async () => {
      webview.props.onLoadEnd({
        nativeEvent: {
          url: `${ATTACKER}/page`,
          title: '',
          loading: false,
          canGoBack: false,
          canGoForward: true,
        },
      });
    });

    expect(previousBridge.onDisconnect).toHaveBeenCalled();
    postMessage(webview, { frameOrigin: ATTACKER, isMainFrame: true });
    postMessage(webview, { frameOrigin: ORIGIN_A, isMainFrame: true });
    expect(mockBridges).toHaveLength(1);
    expect(previousBridge.onMessage).toHaveBeenCalledTimes(1);
  });

  it('binds the bridge to a blocked history page once the user whitelists it', async () => {
    const webview = await renderWebView();
    mockGetPhishingTestResultAsync.mockResolvedValue({
      result: true,
      name: 'blocklist',
    } as Awaited<ReturnType<typeof getPhishingTestResultAsync>>);
    await act(async () => {
      webview.props.onNavigationStateChange({
        url: `${ATTACKER}/account?id=7`,
        title: '',
        loading: false,
        canGoBack: false,
        canGoForward: true,
        navigationType: 'backforward',
      });
    });
    postMessage(webview, { frameOrigin: ATTACKER, isMainFrame: true });
    expect(mockBridges).toHaveLength(0);

    await act(async () => {
      mockStore.dispatch(addToWhitelist(ATTACKER));
    });

    expect(mockBridges).toHaveLength(1);
    expect(mockBridges[0].url).toBe(ATTACKER);
    expect(mockBridges[0].onMessage).toHaveBeenCalledTimes(1);
  });

  it('does not replay requests from the departed page after a redirect back to its origin', async () => {
    const webview = await renderWebView();
    await loadStart(webview, `${ORIGIN_A}/page`);
    await act(async () => {
      webview.props.onLoadEnd({
        nativeEvent: {
          url: `${ORIGIN_A}/page`,
          title: '',
          loading: false,
          canGoBack: false,
          canGoForward: false,
        },
      });
    });
    postMessage(webview, { frameOrigin: ORIGIN_A, isMainFrame: true });
    const departedBridge = mockBridges[0];

    await loadStart(webview, `${ORIGIN_B}/page`);
    // The departing A document still sends while B loads
    postMessage(webview, { frameOrigin: ORIGIN_A, isMainFrame: true });

    // B redirects back to A without a new load start
    await act(async () => {
      webview.props.onLoadEnd({
        nativeEvent: {
          url: `${ORIGIN_A}/return`,
          title: '',
          loading: false,
          canGoBack: true,
          canGoForward: false,
        },
      });
    });

    expect(departedBridge.onMessage).toHaveBeenCalledTimes(1);
    expect(mockBridges).toHaveLength(1);

    postMessage(webview, { frameOrigin: ORIGIN_A, isMainFrame: true });
    expect(mockBridges).toHaveLength(2);
    expect(mockBridges[1].url).toBe(ORIGIN_A);
    expect(mockBridges[1].onMessage).toHaveBeenCalledTimes(1);
  });
});
