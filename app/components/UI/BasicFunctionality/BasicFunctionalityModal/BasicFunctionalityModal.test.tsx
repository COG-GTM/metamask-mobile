// Third party dependencies.
import React from 'react';

// Internal dependencies.
import BasicFunctionalityModal from './BasicFunctionalityModal';
import renderWithProvider from '../../../../util/test/renderWithProvider';
import { useNavigation } from '@react-navigation/native';
import { DeepPartial } from 'redux';
import { RootState } from '../../../../reducers';

export type { RootState };

type MockRootState = DeepPartial<RootState>;

const mockInitialState: MockRootState = {
  engine: {
    backgroundState: {
      UserStorageController: {
        isProfileSyncingEnabled: false,
      },
      NotificationServicesController: {
        isNotificationServicesEnabled: false,
      },
    },
  },
};

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
  };
});

jest.mock('@react-navigation/native', () => {
  const actualReactNavigation = jest.requireActual('@react-navigation/native');
  return {
    ...actualReactNavigation,
    useNavigation: () => ({
      navigate: jest.fn(),
      setOptions: jest.fn(),
      goBack: jest.fn(),
      reset: jest.fn(),
      dangerouslyGetParent: () => ({
        pop: jest.fn(),
      }),
    }),
  };
});

const BasicFunctionalityModalWithNavigation =
  BasicFunctionalityModal as unknown as React.ComponentType<{
    navigation: ReturnType<typeof useNavigation>;
  }>;

describe('BasicFunctionalityModal', () => {
  it('should render correctly', () => {
    const { toJSON } = renderWithProvider(
      <BasicFunctionalityModalWithNavigation navigation={useNavigation()} />,
      { state: mockInitialState as Record<string, unknown> },
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
