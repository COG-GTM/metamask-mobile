import React from 'react';
import renderWithProvider from '../../../util/test/renderWithProvider';
import ThemeSettings from './index';
import { backgroundState } from '../../../util/test/initial-root-state';

jest.mock('react-native-safe-area-context', () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    useSafeAreaInsets: jest.fn().mockImplementation(() => inset),
  };
});

jest.mock('../../UI/ReusableModal', () => {
  const { forwardRef } = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: forwardRef(({ children }: { children: React.ReactNode }, _ref: React.Ref<unknown>) => (
      <View>{children}</View>
    )),
  };
});

const initialState = {
  engine: {
    backgroundState,
  },
  user: {
    appTheme: 'os',
  },
};

describe('ThemeSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { toJSON } = renderWithProvider(<ThemeSettings />, {
      state: initialState,
    });
    expect(toJSON()).toBeTruthy();
  });

  it('renders theme options', () => {
    const { getByText } = renderWithProvider(<ThemeSettings />, {
      state: initialState,
    });
    expect(getByText('Light')).toBeDefined();
    expect(getByText('Dark')).toBeDefined();
  });
});
