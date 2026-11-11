import React from 'react';
import { act } from '@testing-library/react-native';
import renderWithProvider from '../../../util/test/renderWithProvider';
import { backgroundState } from '../../../util/test/initial-root-state';
import { MOCK_ACCOUNTS_CONTROLLER_STATE } from '../../../util/test/accountsControllerTestUtils';
import BrowserTab from './BrowserTab';
import AppConstants from '../../../core/AppConstants';
import { BrowserViewSelectorsIDs } from '../../../../e2e/selectors/Browser/BrowserView.selectors';
import { ConnectionType } from '../../UI/BrowserUrlBar';

const mockSetParams = jest.fn();
const mockNavigation = {
  goBack: jest.fn(),
  goForward: jest.fn(),
  canGoBack: true,
  canGoForward: true,
  addListener: jest.fn(),
  setParams: mockSetParams,
  navigate: jest.fn(),
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

jest.mock('../../../util/phishingDetection', () => ({
  ...jest.requireActual('../../../util/phishingDetection'),
  getPhishingTestResult: () => ({ result: false }),
  getPhishingTestResultAsync: () => Promise.resolve({ result: false }),
  isProductSafetyDappScanningEnabled: () => false,
}));

const mockBridges: {
  url: string;
  getRpcMethodMiddleware: (args: {
    hostname: string;
    getProviderState: () => void;
  }) => unknown;
}[] = [];
jest.mock('../../../core/BackgroundBridge/BackgroundBridge', () =>
  jest.fn().mockImplementation((args) => {
    mockBridges.push(args);
    return {
      url: args.url,
      onDisconnect: jest.fn(),
      onMessage: jest.fn(),
      sendNotification: jest.fn(),
    };
  }),
);

jest.mock('../../../core/EntryScriptWeb3', () => ({
  get: () => Promise.resolve('entry-script'),
}));

const mockGetRpcMethodMiddleware = jest.fn();
jest.mock('../../../core/RPCMethods/RPCMethodMiddleware', () => ({
  getRpcMethodMiddleware: (args: unknown) => mockGetRpcMethodMiddleware(args),
}));

const mockUrlBarText: string[] = [];
const mockConnectionTypes: string[] = [];
jest.mock('../../UI/BrowserUrlBar', () => {
  const actual = jest.requireActual('../../UI/BrowserUrlBar');
  const ReactActual = jest.requireActual('react');
  const MockUrlBar = ReactActual.forwardRef(
    (props: { connectionType: string }, ref: unknown) => {
      mockConnectionTypes.push(props.connectionType);
      ReactActual.useImperativeHandle(ref, () => ({
        hide: jest.fn(),
        blur: jest.fn(),
        focus: jest.fn(),
        setNativeProps: ({ text }: { text: string }) =>
          mockUrlBarText.push(text),
      }));
      return null;
    },
  );
  return { __esModule: true, ...actual, default: MockUrlBar };
});

jest.mock('../../UI/UrlAutocomplete', () => {
  const actual = jest.requireActual('../../UI/UrlAutocomplete');
  const ReactActual = jest.requireActual('react');
  return {
    __esModule: true,
    ...actual,
    default: ReactActual.forwardRef(() => null),
  };
});

const mockState = {
  browser: { activeTab: 1, tabs: [], history: [], whitelist: [] },
  engine: {
    backgroundState: {
      ...backgroundState,
      AccountsController: MOCK_ACCOUNTS_CONTROLLER_STATE,
    },
  },
  transaction: { selectedAsset: '' },
};

const mockUpdateTabInfo = jest.fn();
const props = {
  id: 1,
  tabId: 1,
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
  updateTabInfo: mockUpdateTabInfo,
  showTabs: jest.fn(),
  setOnboardingWizardStep: jest.fn(),
  wizardStep: 1,
  isIpfsGatewayEnabled: false,
  chainId: '0x1',
  isInTabsView: false,
  initialUrl: 'https://acme.example',
  homePageUrl: AppConstants.HOMEPAGE_URL,
};

const navEvent = (url: string, title = '') => ({
  nativeEvent: {
    url,
    title,
    canGoBack: true,
    canGoForward: false,
    loading: false,
  },
});

const flush = () => act(async () => await new Promise((r) => setTimeout(r, 0)));

const latestMiddlewareInfo = () => {
  const bridge = mockBridges[mockBridges.length - 1];
  bridge.getRpcMethodMiddleware({
    hostname: 'unused',
    getProviderState: jest.fn(),
  });
  const args = mockGetRpcMethodMiddleware.mock.calls.at(-1)[0];
  return {
    url: args.url.current,
    title: args.title.current,
    icon: args.icon.current,
  };
};

describe('BrowserTab origin display', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBridges.length = 0;
    mockUrlBarText.length = 0;
    mockConnectionTypes.length = 0;
  });

  const loadTrustedPage = async () => {
    const utils = renderWithProvider(<BrowserTab {...props} />, {
      state: mockState,
    });
    const webview = await utils.findByTestId(
      BrowserViewSelectorsIDs.BROWSER_WEBVIEW_ID,
    );
    await act(async () => {
      await webview.props.onLoadStart(navEvent('https://acme.example/listing'));
    });
    await act(async () => {
      webview.props.onLoadEnd(
        navEvent('https://acme.example/listing', 'Acme Market'),
      );
    });
    await flush();
    return webview;
  };

  it('shows the new site as soon as its navigation starts', async () => {
    const webview = await loadTrustedPage();
    expect(mockUrlBarText.at(-1)).toBe('acme.example');

    mockUpdateTabInfo.mockClear();
    await act(async () => {
      // evil.example never reaches onLoadEnd (e.g. a hanging image)
      await webview.props.onLoadStart(navEvent('http://evil.example/claim'));
    });
    await flush();

    expect(mockUrlBarText.at(-1)).toBe('evil.example');
    expect(mockConnectionTypes.at(-1)).toBe(ConnectionType.UNSECURE);
    expect(mockUpdateTabInfo).toHaveBeenCalledWith(1, {
      url: 'http://evil.example/claim',
    });
    expect(mockSetParams).toHaveBeenLastCalledWith({
      url: 'http://evil.example/claim',
    });
  });

  it('gives approvals the page info of the bridge origin', async () => {
    const webview = await loadTrustedPage();
    expect(latestMiddlewareInfo()).toEqual(
      expect.objectContaining({
        url: 'https://acme.example/listing',
        title: 'Acme Market',
      }),
    );

    await act(async () => {
      await webview.props.onLoadStart(navEvent('https://evil.example/claim'));
    });
    await flush();

    expect(mockBridges.at(-1)?.url).toBe('https://evil.example');
    const info = latestMiddlewareInfo();
    expect(info.url).toBe('https://evil.example/claim');
    expect(info.title).toBe('evil.example');
    expect(info.icon).toBeUndefined();
  });

  it('never gives a bridge page info from another origin', async () => {
    const webview = await loadTrustedPage();
    const acmeBridge = mockBridges.at(-1);

    await act(async () => {
      await webview.props.onLoadStart(navEvent('https://evil.example/claim'));
    });
    await flush();

    acmeBridge?.getRpcMethodMiddleware({
      hostname: 'acme.example',
      getProviderState: jest.fn(),
    });
    const args = mockGetRpcMethodMiddleware.mock.calls.at(-1)[0];
    expect(args.url.current).toBe('https://acme.example');
    expect(args.title.current).toBe('acme.example');
  });
});
