import React from 'react';
import { act } from '@testing-library/react-native';
import renderWithProvider from '../../../util/test/renderWithProvider';
import { backgroundState } from '../../../util/test/initial-root-state';
import { MOCK_ACCOUNTS_CONTROLLER_STATE } from '../../../util/test/accountsControllerTestUtils';
import BrowserTab from './BrowserTab';
import AppConstants from '../../../core/AppConstants';

const mockNavigation = {
  goBack: jest.fn(),
  goForward: jest.fn(),
  canGoBack: true,
  canGoForward: true,
  addListener: jest.fn(),
  setParams: jest.fn(),
  navigate: jest.fn(),
};

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => mockNavigation,
    useIsFocused: () => true,
    useRoute: () => ({ params: {} }),
  };
});

const mockInjectJavaScript = jest.fn();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockWebViewProps: Record<string, any> = {};

jest.mock('@metamask/react-native-webview', () => {
  const { forwardRef, useImperativeHandle } = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const WebView = forwardRef((props: Record<string, any>, ref: unknown) => {
    mockWebViewProps = props;
    useImperativeHandle(ref, () => ({
      injectJavaScript: mockInjectJavaScript,
      stopLoading: jest.fn(),
      goBack: jest.fn(),
      goForward: jest.fn(),
      reload: jest.fn(),
    }));
    return <View testID={props.testID} />;
  });
  return { __esModule: true, default: WebView, WebView };
});

jest.mock('../../../core/BackgroundBridge/BackgroundBridge', () =>
  jest.fn().mockImplementation(() => ({
    onDisconnect: jest.fn(),
    onMessage: jest.fn(),
    sendNotification: jest.fn(),
  })),
);

jest.mock('../../../core/EntryScriptWeb3', () => ({
  get: jest.fn().mockResolvedValue('mock-entry-script'),
}));

jest.mock('../../../util/phishingDetection', () => ({
  ...jest.requireActual('../../../util/phishingDetection'),
  getPhishingTestResultAsync: jest.fn().mockResolvedValue({ result: false }),
  isProductSafetyDappScanningEnabled: jest.fn().mockReturnValue(false),
}));

jest.mock('../../hooks/useMetrics', () => {
  const builder = {
    addProperties: () => builder,
    build: () => ({}),
  };
  return {
    ...jest.requireActual('../../hooks/useMetrics'),
    useMetrics: () => ({
      trackEvent: jest.fn(),
      isEnabled: () => true,
      getMetaMetricsId: () => Promise.resolve('mock-distinct-id'),
      createEventBuilder: () => builder,
    }),
  };
});

const mockInitialState = {
  browser: { activeTab: '' },
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

jest.mock('../../../core/Engine', () => ({
  context: {
    PhishingController: {
      maybeUpdateState: jest.fn(),
      test: () => ({ result: true, name: 'test' }),
    },
    PermissionController: { state: { subjects: {} } },
    CurrencyRateController: { updateExchangeRate: jest.fn() },
    NetworkController: {
      getProviderAndBlockTracker: () => ({ provider: {}, blockTracker: {} }),
    },
  },
}));

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

describe('BrowserTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    const { toJSON } = renderWithProvider(<BrowserTab {...mockProps} />, {
      state: mockInitialState,
    });
    expect(toJSON()).toMatchSnapshot();
  });

  describe('homepage scripts', () => {
    const activeTabState = {
      ...mockInitialState,
      browser: {
        activeTab: 1,
        tabs: [{ id: 1, url: AppConstants.HOMEPAGE_URL }],
        whitelist: [],
        history: [],
      },
      bookmarks: [{ name: 'Uniswap', url: 'https://app.uniswap.org' }],
    };
    const homepageEvent = {
      nativeEvent: {
        url: AppConstants.HOMEPAGE_URL,
        title: 'MetaMask Portfolio',
        canGoBack: true,
        canGoForward: false,
      },
    };

    const flush = () => act(async () => new Promise((r) => setTimeout(r, 0)));

    const renderActiveTab = async () => {
      renderWithProvider(<BrowserTab {...mockProps} />, {
        state: activeTabState,
      });
      await flush();
      expect(mockWebViewProps.onLoadStart).toBeDefined();
    };

    it('does not inject when the homepage only starts loading', async () => {
      await renderActiveTab();

      await act(async () => {
        await mockWebViewProps.onLoadStart(homepageEvent);
      });
      await flush();

      expect(mockInjectJavaScript).not.toHaveBeenCalled();
    });

    it('injects once the homepage document has loaded', async () => {
      await renderActiveTab();

      await act(async () => {
        await mockWebViewProps.onLoadStart(homepageEvent);
        mockWebViewProps.onLoadEnd(homepageEvent);
      });
      await flush();

      expect(mockInjectJavaScript).toHaveBeenCalledTimes(1);
      const script = mockInjectJavaScript.mock.calls[0][0];
      expect(script).toContain('window.location.origin');
      expect(script).toContain('https://app.uniswap.org');
      expect(script).toContain('mock-distinct-id');
    });

    it('does not inject when a non-homepage document loads', async () => {
      await renderActiveTab();

      const malloryEvent = {
        nativeEvent: {
          ...homepageEvent.nativeEvent,
          url: 'https://deals.mallory.example/',
        },
      };
      await act(async () => {
        await mockWebViewProps.onLoadStart(malloryEvent);
        mockWebViewProps.onLoadEnd(malloryEvent);
      });
      await flush();

      expect(mockInjectJavaScript).not.toHaveBeenCalled();
    });
  });
});
