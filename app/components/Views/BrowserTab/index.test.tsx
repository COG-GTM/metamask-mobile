import React from 'react';
import { act, fireEvent, waitFor } from '@testing-library/react-native';
import renderWithProvider from '../../../util/test/renderWithProvider';
import { backgroundState } from '../../../util/test/initial-root-state';
import { MOCK_ACCOUNTS_CONTROLLER_STATE } from '../../../util/test/accountsControllerTestUtils';
import BrowserTab from './BrowserTab';
import AppConstants from '../../../core/AppConstants';
import BackgroundBridge from '../../../core/BackgroundBridge/BackgroundBridge';
import resolveEnsToIpfsContentId from '../../../lib/ens-ipfs/resolver';
import { BrowserViewSelectorsIDs } from '../../../../e2e/selectors/Browser/BrowserView.selectors';
import { BrowserURLBarSelectorsIDs } from '../../../../e2e/selectors/Browser/BrowserURLBar.selectors';

const mockNavigation = {
  goBack: jest.fn(),
  goForward: jest.fn(),
  canGoBack: true,
  canGoForward: true,
  addListener: jest.fn(),
};

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => mockNavigation,
    useIsFocused: () => true,
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

const mockPhishingTest = jest.fn(() => ({ result: true, name: 'test' }));

jest.mock('../../../core/Engine', () => ({
  context: {
    PhishingController: {
      maybeUpdateState: jest.fn(),
      test: () => mockPhishingTest(),
      scanUrl: async () => ({
        recommendedAction: mockPhishingTest().result ? 'BLOCK' : 'NONE',
      }),
    },
    NetworkController: {
      getProviderAndBlockTracker: () => ({ provider: {} }),
    },
    PermissionController: {
      state: { subjects: {} },
    },
  },
}));

jest.mock('../../../core/BackgroundBridge/BackgroundBridge', () =>
  jest.fn().mockImplementation(() => ({
    onDisconnect: jest.fn(),
    onMessage: jest.fn(),
    sendNotification: jest.fn(),
  })),
);

jest.mock('../../../lib/ens-ipfs/resolver', () => jest.fn());

jest.mock('../../UI/AccountRightButton', () => () => null);
jest.mock('../../UI/BrowserBottomBar', () => () => null);
jest.mock('../../UI/UrlAutocomplete', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  const { forwardRef, useImperativeHandle } = require('react');
  return forwardRef((_: unknown, ref: unknown) => {
    useImperativeHandle(ref, () => ({
      show: jest.fn(),
      hide: jest.fn(),
      search: jest.fn(),
    }));
    return null;
  });
});

jest.mock('../../../core/EntryScriptWeb3', () => ({
  get: jest.fn(async () => ''),
  init: jest.fn(),
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

  describe('ENS sites on a shared path-based gateway', () => {
    const IPFS_GATEWAY = 'https://ipfs.io/ipfs/';
    const ensContent: Record<string, string> = {
      'gooddapp.eth': 'QmGoodDappCid',
      'baddapp.eth': 'QmBadDappCid',
    };
    const originalFetch = global.fetch;

    beforeEach(() => {
      mockPhishingTest.mockReturnValue({ result: false, name: 'test' });
      (resolveEnsToIpfsContentId as jest.Mock).mockImplementation(
        async ({ name }: { name: string }) => ({
          type: 'ipfs-ns',
          hash: ensContent[name],
        }),
      );
      global.fetch = jest.fn(async () => ({ status: 200 })) as jest.Mock;
    });

    afterEach(() => {
      global.fetch = originalFetch;
      mockPhishingTest.mockReturnValue({ result: true, name: 'test' });
    });

    it('creates a separate permission origin for each ENS name', async () => {
      const { getByTestId } = renderWithProvider(
        <BrowserTab {...mockProps} />,
        {
          state: {
            ...mockInitialState,
            browser: { activeTab: mockProps.id, tabs: [], whitelist: [] },
            engine: {
              backgroundState: {
                ...mockInitialState.engine.backgroundState,
                PreferencesController: {
                  ...mockInitialState.engine.backgroundState
                    .PreferencesController,
                  ipfsGateway: IPFS_GATEWAY,
                  isIpfsGatewayEnabled: true,
                },
              },
            },
          },
        },
      );

      const loadEnsName = async (ensName: string) => {
        await act(async () => {
          fireEvent(
            getByTestId(BrowserURLBarSelectorsIDs.URL_INPUT),
            'submitEditing',
            { nativeEvent: { text: ensName } },
          );
        });
        await waitFor(() =>
          expect(resolveEnsToIpfsContentId).toHaveBeenCalledWith(
            expect.objectContaining({ name: ensName }),
          ),
        );
        const gatewayUrl = `${IPFS_GATEWAY}${ensContent[ensName]}/`;
        await act(async () => {
          await getByTestId(
            BrowserViewSelectorsIDs.BROWSER_WEBVIEW_ID,
          ).props.onLoadStart({ nativeEvent: { url: gatewayUrl } });
        });
      };

      await loadEnsName('gooddapp.eth');
      await loadEnsName('baddapp.eth');

      const bridgeUrls = (
        BackgroundBridge as unknown as jest.Mock
      ).mock.calls.map(([{ url }]) => url);
      expect(bridgeUrls).toEqual([
        'https://gooddapp.eth',
        'https://baddapp.eth',
      ]);
    });
  });
});
