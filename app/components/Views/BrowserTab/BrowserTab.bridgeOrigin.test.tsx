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
  getRpcMethodMiddleware: (args: {
    hostname: string;
    getProviderState: () => void;
  }) => unknown;
}

const mockBridges: MockBridge[] = [];

jest.mock('../../../core/BackgroundBridge/BackgroundBridge', () =>
  jest
    .fn()
    .mockImplementation(
      ({
        url,
        getRpcMethodMiddleware,
      }: Pick<MockBridge, 'url' | 'getRpcMethodMiddleware'>) => {
        const bridge = {
          url,
          getRpcMethodMiddleware,
          onMessage: jest.fn(),
          onDisconnect: jest.fn(),
          sendNotification: jest.fn(),
        };
        mockBridges.push(bridge);
        return bridge;
      },
    ),
);

jest.mock('../../../core/RPCMethods/RPCMethodMiddleware', () => ({
  getRpcMethodMiddleware: jest.fn((args) => args),
}));

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
      addListener: jest.fn(() => jest.fn()),
      setParams: jest.fn(),
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
    PermissionController: {
      state: { subjects: {} },
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

const deferredScan = () => {
  const pending: Record<string, (value: typeof SAFE) => void> = {};
  mockGetPhishingTestResultAsync.mockImplementation(
    (origin: string) =>
      new Promise((resolve) => {
        pending[origin] = resolve;
      }),
  );
  return pending;
};

const loadPage = async (
  getWebView: () => ReturnType<
    ReturnType<typeof renderWithProvider>['getByTestId']
  >,
  url: string,
  title: string,
) => {
  await act(async () => {
    await getWebView().props.onLoadStart({ nativeEvent: { url } });
  });
  await act(async () => {
    getWebView().props.onLoadEnd({
      nativeEvent: { url, title, canGoBack: true, canGoForward: false },
    });
  });
};

const ACCOUNTS_CHANGED = expect.objectContaining({
  method: 'metamask_accountsChanged',
});

describe('BrowserTab background bridge across navigations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBridges.length = 0;
  });

  it('disconnects the previous site bridge before the next site is scanned and routes none of its messages there', async () => {
    mockGetPhishingTestResultAsync.mockResolvedValue(SAFE);
    const getWebView = await renderWebView();
    await loadPage(getWebView, 'https://acme-swap.example/', 'Acme Swap');
    const [acmeBridge] = mockBridges;
    expect(acmeBridge.url).toBe('https://acme-swap.example');

    const scans = deferredScan();
    let loadStart: Promise<unknown> = Promise.resolve();
    act(() => {
      loadStart = getWebView().props.onLoadStart({
        nativeEvent: { url: 'https://mallory.example/' },
      });
    });

    // Scan still pending: the old bridge is gone and nothing new exists yet
    expect(acmeBridge.onDisconnect).toHaveBeenCalledTimes(1);
    expect(mockBridges).toHaveLength(1);

    act(() => {
      getWebView().props.onMessage(
        providerMessage('https://mallory.example/', 1),
      );
    });
    expect(acmeBridge.onMessage).not.toHaveBeenCalled();
    expect(acmeBridge.sendNotification).not.toHaveBeenCalledWith(
      ACCOUNTS_CHANGED,
    );

    await act(async () => {
      scans['https://mallory.example'](SAFE);
      await loadStart;
    });

    const [, malloryBridge] = mockBridges;
    expect(malloryBridge.url).toBe('https://mallory.example');
    expect(acmeBridge.onMessage).not.toHaveBeenCalled();
    // The held request is served by the bridge bound to the page that sent it
    expect(malloryBridge.onMessage).toHaveBeenCalledTimes(1);
    expect(malloryBridge.onMessage).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ id: 1 }) }),
    );
    // Acme Swap's permitted accounts are never pushed into Mallory's page
    expect(malloryBridge.sendNotification).not.toHaveBeenCalledWith(
      ACCOUNTS_CHANGED,
    );
  });

  it('labels approvals from the new bridge with its own origin, not the previous page title and url', async () => {
    mockGetPhishingTestResultAsync.mockResolvedValue(SAFE);
    const getWebView = await renderWebView();
    await loadPage(getWebView, 'https://acme-swap.example/', 'Acme Swap');

    await act(async () => {
      await getWebView().props.onLoadStart({
        nativeEvent: { url: 'https://mallory.example/' },
      });
    });
    const [acmeBridge, malloryBridge] = mockBridges;
    const pageMeta = (bridge: MockBridge, hostname: string) => {
      const { url, title } = bridge.getRpcMethodMiddleware({
        hostname,
        getProviderState: jest.fn(),
      }) as {
        url: { current: string };
        title: { current: string };
      };
      return { url: url.current, title: title.current };
    };

    expect(pageMeta(malloryBridge, 'mallory.example')).toEqual({
      url: 'https://mallory.example',
      title: 'mallory.example',
    });
    expect(pageMeta(acmeBridge, 'acme-swap.example')).toEqual({
      url: 'https://acme-swap.example/',
      title: 'Acme Swap',
    });
  });

  it('disconnects the previous bridge and installs none when the next site is blocked', async () => {
    mockGetPhishingTestResultAsync.mockResolvedValue(SAFE);
    const getWebView = await renderWebView();
    await loadPage(getWebView, 'https://acme-swap.example/', 'Acme Swap');
    const [acmeBridge] = mockBridges;

    mockGetPhishingTestResultAsync.mockResolvedValue({
      result: true,
      name: 'DAPP_SCANNING',
    } as Awaited<ReturnType<typeof getPhishingTestResultAsync>>);
    await act(async () => {
      await getWebView().props.onLoadStart({
        nativeEvent: { url: 'https://mallory.example/' },
      });
    });
    act(() => {
      getWebView().props.onMessage(
        providerMessage('https://mallory.example/', 1),
      );
    });

    expect(acmeBridge.onDisconnect).toHaveBeenCalledTimes(1);
    expect(acmeBridge.onMessage).not.toHaveBeenCalled();
    expect(mockBridges).toHaveLength(1);
  });

  it('drops provider messages whose sender origin differs from the installed bridge', async () => {
    mockGetPhishingTestResultAsync.mockResolvedValue(SAFE);
    const getWebView = await renderWebView();
    await loadPage(getWebView, 'https://acme-swap.example/', 'Acme Swap');
    const [acmeBridge] = mockBridges;

    act(() => {
      getWebView().props.onMessage(
        providerMessage('https://mallory.example/', 1),
      );
      getWebView().props.onMessage(
        providerMessage('https://acme-swap.example/trade', 2),
      );
    });

    expect(acmeBridge.onMessage).toHaveBeenCalledTimes(1);
    expect(acmeBridge.onMessage).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ id: 2 }) }),
    );
  });

  it('does not install a bridge for a navigation superseded while its scan was pending', async () => {
    const scans = deferredScan();
    const getWebView = await renderWebView();

    let first: Promise<unknown> = Promise.resolve();
    let second: Promise<unknown> = Promise.resolve();
    act(() => {
      first = getWebView().props.onLoadStart({
        nativeEvent: { url: 'https://acme-swap.example/' },
      });
      getWebView().props.onMessage(
        providerMessage('https://acme-swap.example/', 1),
      );
      second = getWebView().props.onLoadStart({
        nativeEvent: { url: 'https://mallory.example/' },
      });
    });
    await act(async () => {
      scans['https://acme-swap.example'](SAFE);
      scans['https://mallory.example'](SAFE);
      await Promise.all([first, second]);
    });

    expect(mockBridges.map(({ url }) => url)).toEqual([
      'https://mallory.example',
    ]);
    expect(mockBridges[0].onMessage).not.toHaveBeenCalled();
  });
});
