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

const PAGE_URL = 'https://acme.market/nft/1';

const providerMessage = (frameInfo: {
  isMainFrame?: boolean;
  frameOrigin?: string;
}) => ({
  nativeEvent: {
    url: PAGE_URL,
    ...frameInfo,
    data: JSON.stringify({
      name: 'metamask-provider',
      data: {
        id: 1,
        jsonrpc: '2.0',
        method: 'eth_sendTransaction',
        params: [{ from: '0x123', to: '0xbad', value: '0x1' }],
      },
    }),
  },
});

describe('BrowserTab provider messages from frames', () => {
  let getWebView: Awaited<ReturnType<typeof renderWebView>>;

  beforeEach(async () => {
    mockBridges.length = 0;
    mockGetPhishingTestResultAsync.mockResolvedValue(SAFE);
    getWebView = await renderWebView();
    await act(async () => {
      await getWebView().props.onLoadStart({ nativeEvent: { url: PAGE_URL } });
    });
    await act(async () => {
      getWebView().props.onLoadEnd({
        nativeEvent: {
          url: PAGE_URL,
          title: 'Acme Market',
          canGoBack: true,
          canGoForward: false,
        },
      });
    });
    await waitFor(() => expect(mockBridges).toHaveLength(1));
    expect(mockBridges[0].url).toBe('https://acme.market');
  });

  const send = (frameInfo: { isMainFrame?: boolean; frameOrigin?: string }) =>
    act(() => {
      getWebView().props.onMessage(providerMessage(frameInfo));
    });

  it('forwards messages from the main frame of the bridge origin', async () => {
    await send({ isMainFrame: true, frameOrigin: 'https://acme.market' });
    expect(mockBridges[0].onMessage).toHaveBeenCalledTimes(1);
    expect(mockBridges[0].onMessage).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'metamask-provider' }),
    );
  });

  it('drops messages posted by a cross-origin iframe', async () => {
    await send({ isMainFrame: false, frameOrigin: 'https://mallory.example' });
    expect(mockBridges[0].onMessage).not.toHaveBeenCalled();
  });

  it('drops messages posted by a sandboxed (opaque-origin) iframe', async () => {
    await send({ isMainFrame: false, frameOrigin: 'null' });
    expect(mockBridges[0].onMessage).not.toHaveBeenCalled();
  });

  it('drops messages posted by a same-origin iframe', async () => {
    await send({ isMainFrame: false, frameOrigin: 'https://acme.market' });
    expect(mockBridges[0].onMessage).not.toHaveBeenCalled();
  });

  it('drops main-frame messages whose origin differs from the bridge', async () => {
    await send({ isMainFrame: true, frameOrigin: 'https://mallory.example' });
    expect(mockBridges[0].onMessage).not.toHaveBeenCalled();
  });

  it('drops messages without native frame info', async () => {
    await send({});
    expect(mockBridges[0].onMessage).not.toHaveBeenCalled();
  });
});
