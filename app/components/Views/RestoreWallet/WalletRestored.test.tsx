import React from 'react';
import renderWithProvider from '../../../util/test/renderWithProvider';
import WalletRestored from './WalletRestored';
import { backgroundState } from '../../../util/test/initial-root-state';

jest.mock('../../UI/StyledButton', () => {
  const { TouchableOpacity, Text } = jest.requireActual('react-native');
  return ({ children, onPress }: { children: React.ReactNode; onPress?: () => void }) => (
    <TouchableOpacity onPress={onPress}>
      <Text>{children}</Text>
    </TouchableOpacity>
  );
});

const mockNavigate = jest.fn();
const mockReplace = jest.fn();
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: mockNavigate,
      replace: mockReplace,
    }),
  };
});

jest.mock('../../../util/navigation/navUtils', () => ({
  createNavigationDetails: jest.fn(
    (screenName: string) =>
      (params?: Record<string, unknown>) =>
        [screenName, params],
  ),
}));

jest.mock('../../../components/hooks/useMetrics', () => ({
  useMetrics: () => ({
    trackEvent: jest.fn(),
    createEventBuilder: jest.fn(() => ({
      addProperties: jest.fn().mockReturnThis(),
      build: jest.fn(),
    })),
  }),
}));

jest.mock('../../../core', () => ({
  Authentication: {
    appTriggeredAuth: jest.fn().mockResolvedValue(true),
  },
}));

jest.mock('react-native-safe-area-context', () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  const frame = { width: 0, height: 0, x: 0, y: 0 };
  return {
    SafeAreaProvider: jest.fn().mockImplementation(({ children }) => children),
    SafeAreaConsumer: jest
      .fn()
      .mockImplementation(({ children }) => children(inset)),
    useSafeAreaInsets: jest.fn().mockImplementation(() => inset),
    useSafeAreaFrame: jest.fn().mockImplementation(() => frame),
    SafeAreaView: jest
      .fn()
      .mockImplementation(({ children }) => children),
  };
});

const initialState = {
  engine: {
    backgroundState,
  },
};

describe('WalletRestored', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { toJSON } = renderWithProvider(<WalletRestored />, {
      state: initialState,
    });
    expect(toJSON()).toBeTruthy();
  });

  it('matches snapshot', () => {
    const { toJSON } = renderWithProvider(<WalletRestored />, {
      state: initialState,
    });
    expect(toJSON()).toMatchSnapshot();
  });
});
