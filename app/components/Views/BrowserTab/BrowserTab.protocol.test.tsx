import React from 'react';
import { Alert, Linking } from 'react-native';
import { act } from '@testing-library/react-native';
import { createOnShouldStartLoadWithRequest } from '@metamask/react-native-webview/src/WebViewShared';
import renderWithProvider from '../../../util/test/renderWithProvider';
import { backgroundState } from '../../../util/test/initial-root-state';
import { MOCK_ACCOUNTS_CONTROLLER_STATE } from '../../../util/test/accountsControllerTestUtils';
import { BrowserViewSelectorsIDs } from '../../../../e2e/selectors/Browser/BrowserView.selectors';
import { strings } from '../../../../locales/i18n';
import AppConstants from '../../../core/AppConstants';
import BrowserTab from './BrowserTab';

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
      test: () => ({ result: false, name: 'test' }),
    },
  },
}));

// Header, URL bar and bottom bar are not under test here
jest.mock('../../UI/BrowserUrlBar', () => {
  const { forwardRef } = jest.requireActual('react');
  return {
    ...jest.requireActual('../../UI/BrowserUrlBar'),
    __esModule: true,
    default: forwardRef(() => null),
  };
});
jest.mock('../../UI/UrlAutocomplete', () => {
  const { forwardRef } = jest.requireActual('react');
  return {
    ...jest.requireActual('../../UI/UrlAutocomplete'),
    __esModule: true,
    default: forwardRef(() => null),
  };
});
jest.mock('../../UI/BrowserBottomBar', () => () => null);

jest.mock('../../../core/EntryScriptWeb3', () => ({
  get: jest.fn().mockResolvedValue('/* entry script */'),
}));

jest.mock('../../../util/phishingDetection', () => ({
  ...jest.requireActual('../../../util/phishingDetection'),
  isProductSafetyDappScanningEnabled: () => false,
}));

const mockInitialState = {
  browser: {
    activeTab: 1,
    tabs: [{ id: 1, url: 'https://metamask.io' }],
    history: [],
    whitelist: [],
    favicons: [],
    visitedDappsByHostname: {},
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
  initialUrl: 'https://metamask.io',
  homePageUrl: AppConstants.HOMEPAGE_URL,
};

type AlertButtons = { text: string; onPress: () => void }[];

describe('BrowserTab :: external URL schemes', () => {
  let alertSpy: jest.SpyInstance;
  let canOpenURLSpy: jest.SpyInstance;
  let openURLSpy: jest.SpyInstance;

  const flushPromises = () =>
    act(async () => {
      await new Promise((resolve) => setImmediate(resolve));
    });

  // Drives the navigation through the WebView library's own handler, which is
  // what the native WebView calls before any URL is loaded or handed to the OS.
  const renderAndNavigate = async (url: string) => {
    const { findByTestId } = renderWithProvider(<BrowserTab {...mockProps} />, {
      state: mockInitialState,
    });
    const webView = await findByTestId(
      BrowserViewSelectorsIDs.BROWSER_WEBVIEW_ID,
    );
    const { originWhitelist, onShouldStartLoadWithRequest } = webView.props;
    const loadRequest = jest.fn();
    createOnShouldStartLoadWithRequest(
      loadRequest,
      originWhitelist,
      onShouldStartLoadWithRequest,
    )({
      nativeEvent: { url, lockIdentifier: 1 },
    } as unknown as Parameters<ReturnType<typeof createOnShouldStartLoadWithRequest>>[0]);
    await flushPromises();
    return { loadRequest, originWhitelist };
  };

  const pressAlertButton = async (text: string) => {
    const buttons = alertSpy.mock.calls[0][2] as AlertButtons;
    buttons.find((button) => button.text === text)?.onPress();
    await flushPromises();
  };

  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    canOpenURLSpy = jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
    openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it('passes every URL scheme to the tab handler', async () => {
    const { originWhitelist } = await renderAndNavigate('https://metamask.io');
    expect(originWhitelist).toEqual(['*']);
  });

  it.each([
    'tel:123',
    'sms:123',
    'mailto:a@b.co',
    'itms-apps://apps.apple.com/app/id1',
  ])('asks before opening %s and opens nothing on Ignore', async (url) => {
    const { loadRequest } = await renderAndNavigate(url);

    expect(loadRequest).toHaveBeenCalledWith(false, url, 1);
    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(alertSpy.mock.calls[0][0]).toBe(strings('onboarding.warning_title'));
    expect(canOpenURLSpy).not.toHaveBeenCalled();
    expect(openURLSpy).not.toHaveBeenCalled();

    await pressAlertButton(strings('browser.protocol_alert_options.ignore'));
    expect(openURLSpy).not.toHaveBeenCalled();
  });

  it('opens tel: only after the user taps Allow', async () => {
    await renderAndNavigate('tel:123');
    expect(alertSpy.mock.calls[0][1]).toBe(
      strings('browser.protocol_alerts.tel'),
    );
    expect(openURLSpy).not.toHaveBeenCalled();

    await pressAlertButton(strings('browser.protocol_alert_options.allow'));
    expect(openURLSpy).toHaveBeenCalledWith('tel:123');
  });

  it('loads https URLs in the WebView without a prompt', async () => {
    const { loadRequest } = await renderAndNavigate('https://example.com/');
    expect(loadRequest).toHaveBeenCalledWith(true, 'https://example.com/', 1);
    expect(alertSpy).not.toHaveBeenCalled();
    expect(openURLSpy).not.toHaveBeenCalled();
  });
});
