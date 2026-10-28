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
  hostname: string;
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
  jest.fn().mockImplementation(({ url, getRpcMethodMiddleware }) => {
    const bridge = {
      url,
      hostname: new URL(url).hostname,
      onMessage: jest.fn(),
      onDisconnect: jest.fn(),
      sendNotification: jest.fn(),
      getRpcMethodMiddleware,
    };
    mockBridges.push(bridge);
    return bridge;
  }),
);

jest.mock('../../../core/RPCMethods/RPCMethodMiddleware', () => ({
  getRpcMethodMiddleware: jest.fn((args) => args),
}));

const mockScanUrl = jest.fn();
jest.mock('../../../util/phishingDetection', () => ({
  getPhishingTestResult: jest.fn(() => ({ result: false })),
  getPhishingTestResultAsync: (origin: string) => mockScanUrl(origin),
  isProductSafetyDappScanningEnabled: jest.fn(() => true),
}));

jest.mock('../../../core/EntryScriptWeb3', () => ({
  get: jest.fn(() => Promise.resolve('')),
}));

jest.mock('../../../core/Engine', () => ({
  context: {
    PhishingController: {
      maybeUpdateState: jest.fn(),
      test: () => ({ result: false, name: 'test' }),
    },
    PermissionController: { state: { subjects: {} } },
  },
}));

jest.mock('../../UI/AccountRightButton', () => () => null);

jest.mock('../../UI/UrlAutocomplete', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  const { forwardRef } = require('react');
  return {
    __esModule: true,
    default: forwardRef(() => null),
  };
});

const mockNavigation = {
  goBack: jest.fn(),
  goForward: jest.fn(),
  canGoBack: true,
  canGoForward: true,
  addListener: jest.fn(() => jest.fn()),
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

const TRUSTED_URL = 'https://trade.example/swap';
const TRUSTED_ORIGIN = 'https://trade.example';
const NEW_URL = 'https://promo.example/claim';
const NEW_ORIGIN = 'https://promo.example';

const mockInitialState = {
  browser: { activeTab: 1, whitelist: [], tabs: [], history: [], favicons: [] },
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
  initialUrl: TRUSTED_URL,
  homePageUrl: AppConstants.HOMEPAGE_URL,
};

const navEvent = (url: string) => ({
  nativeEvent: {
    url,
    title: url,
    loading: false,
    canGoBack: true,
    canGoForward: false,
    lockIdentifier: 0,
  },
});

const providerMessage = (url: string) => ({
  nativeEvent: {
    url,
    data: JSON.stringify({
      name: 'metamask-provider',
      data: { id: 1, jsonrpc: '2.0', method: 'personal_sign', params: [] },
    }),
  },
});

const bridgeFor = (origin: string) =>
  mockBridges.filter((bridge) => bridge.url === origin).pop();

const renderTab = async () => {
  const utils = renderWithProvider(<BrowserTab {...mockProps} />, {
    state: mockInitialState,
  });
  const webview = await utils.findByTestId(
    BrowserViewSelectorsIDs.BROWSER_WEBVIEW_ID,
  );
  return webview.props;
};

const loadTrustedDapp = async (props: Record<string, jest.Mock>) => {
  mockScanUrl.mockResolvedValueOnce({ result: false });
  await act(async () => {
    await props.onLoadStart(navEvent(TRUSTED_URL));
  });
  await act(async () => {
    props.onLoadEnd(navEvent(TRUSTED_URL));
  });
};

describe('BrowserTab background bridge origin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBridges.length = 0;
  });

  it('never forwards messages to the previous site bridge while the new site is being scanned', async () => {
    const props = await renderTab();
    await loadTrustedDapp(props);
    const trustedBridge = bridgeFor(TRUSTED_ORIGIN) as MockBridge;

    mockScanUrl.mockReturnValueOnce(new Promise(() => undefined));
    await act(async () => {
      props.onLoadStart(navEvent(NEW_URL));
    });

    expect(trustedBridge.onDisconnect).toHaveBeenCalled();
    const newBridge = bridgeFor(NEW_ORIGIN) as MockBridge;
    expect(newBridge).toBeDefined();

    props.onMessage(providerMessage(NEW_URL));
    expect(trustedBridge.onMessage).not.toHaveBeenCalled();
    expect(newBridge.onMessage).not.toHaveBeenCalled();
  });

  it('delivers messages held during the scan once the new site is allowed', async () => {
    const props = await renderTab();
    await loadTrustedDapp(props);
    const trustedBridge = bridgeFor(TRUSTED_ORIGIN) as MockBridge;

    let resolveScan: (value: unknown) => void = () => undefined;
    mockScanUrl.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveScan = resolve;
      }),
    );
    let loadStart: Promise<unknown> = Promise.resolve();
    await act(async () => {
      loadStart = props.onLoadStart(navEvent(NEW_URL));
    });
    const newBridge = bridgeFor(NEW_ORIGIN) as MockBridge;

    props.onMessage(providerMessage(NEW_URL));
    expect(newBridge.onMessage).not.toHaveBeenCalled();

    await act(async () => {
      resolveScan({ result: false });
      await loadStart;
    });
    expect(newBridge.onMessage).toHaveBeenCalledTimes(1);
    expect(trustedBridge.onMessage).not.toHaveBeenCalled();

    props.onMessage(providerMessage(NEW_URL));
    expect(newBridge.onMessage).toHaveBeenCalledTimes(2);
  });

  it('drops messages whose document origin does not match the active bridge', async () => {
    const props = await renderTab();
    await loadTrustedDapp(props);

    mockScanUrl.mockReturnValueOnce(new Promise(() => undefined));
    await act(async () => {
      props.onLoadStart(navEvent(NEW_URL));
    });

    props.onMessage(providerMessage(TRUSTED_URL));
    expect(bridgeFor(TRUSTED_ORIGIN)?.onMessage).not.toHaveBeenCalled();
    expect(bridgeFor(NEW_ORIGIN)?.onMessage).not.toHaveBeenCalled();
  });

  it('disconnects every bridge and drops messages when the new site is blocked', async () => {
    const props = await renderTab();
    await loadTrustedDapp(props);
    const trustedBridge = bridgeFor(TRUSTED_ORIGIN) as MockBridge;

    let resolveScan: (value: unknown) => void = () => undefined;
    mockScanUrl.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveScan = resolve;
      }),
    );
    let loadStart: Promise<unknown> = Promise.resolve();
    await act(async () => {
      loadStart = props.onLoadStart(navEvent(NEW_URL));
    });
    // Sent by the blocked page while the scan is still in flight
    props.onMessage(providerMessage(NEW_URL));
    await act(async () => {
      resolveScan({ result: true, name: 'phishing' });
      await loadStart;
    });

    expect(trustedBridge.onDisconnect).toHaveBeenCalled();
    const blockedBridge = bridgeFor(NEW_ORIGIN) as MockBridge;
    expect(blockedBridge.onDisconnect).toHaveBeenCalled();

    props.onMessage(providerMessage(NEW_URL));
    expect(trustedBridge.onMessage).not.toHaveBeenCalled();
    expect(blockedBridge.onMessage).not.toHaveBeenCalled();
  });

  it('keeps the latest bridge when an earlier navigation scan resolves as blocked', async () => {
    const props = await renderTab();
    await loadTrustedDapp(props);

    let resolveBlocked: (value: unknown) => void = () => undefined;
    mockScanUrl.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveBlocked = resolve;
      }),
    );
    await act(async () => {
      props.onLoadStart(navEvent(NEW_URL));
    });

    const LATEST_URL = 'https://latest.example/';
    mockScanUrl.mockResolvedValueOnce({ result: false });
    await act(async () => {
      await props.onLoadStart(navEvent(LATEST_URL));
    });
    await act(async () => {
      resolveBlocked({ result: true, name: 'phishing' });
    });

    const latestBridge = bridgeFor('https://latest.example') as MockBridge;
    expect(latestBridge.onDisconnect).not.toHaveBeenCalled();
    props.onMessage(providerMessage(LATEST_URL));
    expect(latestBridge.onMessage).toHaveBeenCalledTimes(1);
  });

  it('labels approvals with the bridge origin instead of the previous page metadata', async () => {
    const props = await renderTab();
    await loadTrustedDapp(props);

    mockScanUrl.mockReturnValueOnce(new Promise(() => undefined));
    await act(async () => {
      props.onLoadStart(navEvent(NEW_URL));
    });

    const middleware = (
      bridgeFor(NEW_ORIGIN) as MockBridge
    ).getRpcMethodMiddleware({
      hostname: 'promo.example',
      getProviderState: jest.fn(),
    }) as {
      url: { current: string };
      title: { current: string };
      icon: { current: unknown };
    };
    expect(middleware.url.current).toBe(NEW_ORIGIN);
    expect(middleware.title.current).toBe('promo.example');
    expect(middleware.icon.current).toBeUndefined();

    const trustedMiddleware = (
      bridgeFor(TRUSTED_ORIGIN) as MockBridge
    ).getRpcMethodMiddleware({
      hostname: 'trade.example',
      getProviderState: jest.fn(),
    }) as { url: { current: string }; title: { current: string } };
    expect(trustedMiddleware.url.current).toBe(TRUSTED_URL);
    expect(trustedMiddleware.title.current).toBe(TRUSTED_URL);
  });
});
