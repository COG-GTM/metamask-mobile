import React from 'react';
import { act } from '@testing-library/react-native';
import { BackHandler } from 'react-native';
import renderWithProvider from '../../../util/test/renderWithProvider';
import { backgroundState } from '../../../util/test/initial-root-state';
import { MOCK_ACCOUNTS_CONTROLLER_STATE } from '../../../util/test/accountsControllerTestUtils';
import BrowserTab from './BrowserTab';
import { setActiveTab } from '../../../actions/browser';
import AppConstants from '../../../core/AppConstants';

const mockNavigation = {
  goBack: jest.fn(),
  goForward: jest.fn(),
  canGoBack: true,
  canGoForward: true,
  addListener: jest.fn<() => void, [string, () => void]>(() => jest.fn()),
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
    CurrencyRateController: {
      updateExchangeRate: jest.fn(),
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

  it('unsubscribes navigation focus/blur listeners and the back handler on unmount', () => {
    const unsubscribers: jest.Mock[] = [];
    mockNavigation.addListener.mockImplementation(() => {
      const unsubscribe = jest.fn();
      unsubscribers.push(unsubscribe);
      return unsubscribe;
    });
    const removeEventListenerSpy = jest.spyOn(
      BackHandler,
      'removeEventListener',
    );

    const { unmount } = renderWithProvider(<BrowserTab {...mockProps} />, {
      state: mockInitialState,
    });

    const registeredEvents = mockNavigation.addListener.mock.calls.map(
      ([event]) => event,
    );
    expect(registeredEvents).toEqual(expect.arrayContaining(['focus', 'blur']));
    expect(unsubscribers.length).toBeGreaterThan(0);

    unmount();

    unsubscribers.forEach((unsubscribe) => {
      expect(unsubscribe).toHaveBeenCalledTimes(1);
    });
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'hardwareBackPress',
      expect.any(Function),
    );
  });

  it('keeps one focus and one blur listener while the active tab changes', () => {
    const liveListeners: Record<string, number> = {};
    mockNavigation.addListener.mockImplementation((event: string) => {
      liveListeners[event] = (liveListeners[event] ?? 0) + 1;
      return jest.fn(() => {
        liveListeners[event] -= 1;
      });
    });

    const { store } = renderWithProvider(<BrowserTab {...mockProps} />, {
      state: {
        ...mockInitialState,
        browser: {
          activeTab: '',
          history: [],
          whitelist: [],
          tabs: [],
          favicons: [],
          visitedDappsByHostname: {},
        },
      },
    });

    for (let i = 0; i < 5; i++) {
      act(() => {
        store.dispatch(setActiveTab(mockProps.id));
      });
      act(() => {
        store.dispatch(setActiveTab(mockProps.id + 1));
      });
    }

    expect(mockNavigation.addListener.mock.calls.length).toBeGreaterThan(2);
    expect(liveListeners).toEqual({ focus: 1, blur: 1 });
  });
});
