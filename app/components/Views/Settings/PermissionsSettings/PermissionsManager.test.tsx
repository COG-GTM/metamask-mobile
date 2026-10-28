import React from 'react';
import { NavigationProp } from '@react-navigation/native';
import renderWithProvider from '../../../../util/test/renderWithProvider';
import PermissionsManager from './PermissionsManager';
import { strings } from '../../../../../locales/i18n';
import { SDKSelectorsIDs } from '../../../../../e2e/selectors/Settings/SDK.selectors';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { backgroundState } from '../../../../util/test/initial-root-state';

const mockNavigate = jest.fn();
const mockSetOptions = jest.fn();

const mockNavigation = {
  navigate: mockNavigate,
  setOptions: mockSetOptions,
} as unknown as NavigationProp<{
  [key: string]: object | undefined;
}>;

jest.mock('react-native-safe-area-context', () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  const frame = { width: 0, height: 0, x: 0, y: 0 };
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
    SafeAreaConsumer: ({
      children,
    }: {
      children: (insets: typeof inset) => React.ReactNode;
    }) => children(inset),
    useSafeAreaInsets: () => inset,
    useSafeAreaFrame: () => frame,
  };
});

describe('PermissionsManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render empty state when no permissions exist', () => {
    const { getByText, getByTestId } = renderWithProvider(
      <SafeAreaProvider>
        <PermissionsManager navigation={mockNavigation} />
      </SafeAreaProvider>,
      {
        state: {
          engine: {
            backgroundState,
          },
        },
      },
    );

    expect(
      getByTestId(SDKSelectorsIDs.SESSION_MANAGER_CONTAINER),
    ).toBeDefined();
    expect(getByText(strings('app_settings.no_permissions'))).toBeDefined();
    expect(
      getByText(strings('app_settings.no_permissions_desc')),
    ).toBeDefined();
  });

  it('lists in-app browser origin subjects but not WalletConnect URLs', () => {
    const makeSubject = (origin: string) => ({ origin, permissions: {} });
    const { getByText, queryByText } = renderWithProvider(
      <SafeAreaProvider>
        <PermissionsManager navigation={mockNavigation} />
      </SafeAreaProvider>,
      {
        state: {
          engine: {
            backgroundState: {
              ...backgroundState,
              PermissionController: {
                subjects: {
                  'dapp.example': makeSubject('dapp.example'),
                  'http://dapp.example': makeSubject('http://dapp.example'),
                  'https://dapp.example:8443': makeSubject(
                    'https://dapp.example:8443',
                  ),
                  'https://wc.example/': makeSubject('https://wc.example/'),
                },
              },
            } as unknown as typeof backgroundState,
          },
        },
      },
    );

    expect(getByText('dapp.example')).toBeDefined();
    expect(getByText('http://dapp.example')).toBeDefined();
    expect(getByText('https://dapp.example:8443')).toBeDefined();
    expect(queryByText('https://wc.example/')).toBeNull();
  });
});
