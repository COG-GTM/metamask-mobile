import React from 'react';
import { View } from 'react-native';
import { act, fireEvent } from '@testing-library/react-native';
import renderWithProvider from '../../../util/test/renderWithProvider';
import { backgroundState } from '../../../util/test/initial-root-state';
import { getPermittedAccountsByHostname } from '../../../core/Permissions';
import MainNavigator from './MainNavigator';

const mockTrackEvent = jest.fn();
const mockAddProperties = jest.fn();

jest.mock('../../../components/hooks/useMetrics', () => ({
  ...jest.requireActual('../../../components/hooks/useMetrics'),
  useMetrics: () => ({
    trackEvent: mockTrackEvent,
    createEventBuilder: () => {
      const builder = {
        addProperties: (props: Record<string, unknown>) => {
          mockAddProperties(props);
          return builder;
        },
        build: () => ({}),
      };
      return builder;
    },
  }),
}));

jest.mock('../../../core/Permissions', () => ({
  ...jest.requireActual('../../../core/Permissions'),
  getPermittedAccountsByHostname: jest.fn(() => ['0xabc']),
}));

// These native UI libs fail to load under jest (preexisting); stub them.
jest.mock('@metamask/react-native-button', () => () => null);
jest.mock('react-native-material-textfield', () => ({
  OutlinedTextField: () => null,
  TextField: () => null,
  FilledTextField: () => null,
}));

jest.mock('react-native-qrcode-svg', () => () => null);

jest.mock('../../../util/termsOfUse/termsOfUse', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('../../Views/Wallet', () => () => null);
jest.mock('../../Views/Browser', () => () => null);
jest.mock('../../UI/Drawer', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  const { forwardRef } = require('react');
  return forwardRef(
    ({ children }: { children: React.ReactNode }, _ref: unknown) => children,
  );
});

jest.mock('react-native-safe-area-context', () => ({
  ...jest.requireActual('react-native-safe-area-context'),
  useSafeAreaInsets: () => ({ top: 0, left: 0, right: 0, bottom: 0 }),
}));

const mockGetPermittedAccountsByHostname =
  getPermittedAccountsByHostname as jest.Mock;

const initialState = {
  wizard: { step: 0 },
  browser: {
    tabs: [
      { id: 1, url: 'https://other.io' },
      { id: 2, url: 'https://app.uniswap.org/swap' },
    ],
    activeTab: 2,
    history: [],
  },
  engine: { backgroundState },
};

describe('MainNavigator HomeTabs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not compute the active dApp accounts on store updates', () => {
    const { store } = renderWithProvider(
      <View>
        <MainNavigator />
      </View>,
      {
        state: initialState,
      },
    );

    act(() => {
      for (let i = 0; i < 20; i++) {
        store.dispatch({
          type: 'ADD_TO_BROWSER_HISTORY',
          url: `https://site${i}.io`,
          name: `site${i}`,
        });
      }
    });

    expect(mockGetPermittedAccountsByHostname).not.toHaveBeenCalled();
  });

  it('reports the active tab dApp accounts when the Browser tab is pressed', () => {
    const { getByTestId } = renderWithProvider(
      <View>
        <MainNavigator />
      </View>,
      { state: initialState },
    );

    fireEvent.press(getByTestId('tab-bar-item-Browser'));

    expect(mockGetPermittedAccountsByHostname).toHaveBeenCalledTimes(1);
    expect(mockGetPermittedAccountsByHostname.mock.calls[0][1]).toBe(
      'app.uniswap.org',
    );
    expect(mockTrackEvent).toHaveBeenCalledTimes(1);
    expect(mockAddProperties).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'Navigation Tab',
        active_connected_dapp: ['0xabc'],
        number_of_open_tabs: 2,
      }),
    );
  });
});
