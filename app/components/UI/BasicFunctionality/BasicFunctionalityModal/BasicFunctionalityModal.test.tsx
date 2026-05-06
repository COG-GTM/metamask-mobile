// Third party dependencies.
import React from 'react';
import { DeepPartial } from 'redux';

// Internal dependencies.
import BasicFunctionalityModal from './BasicFunctionalityModal';
import renderWithProvider from '../../../../util/test/renderWithProvider';
import { RootState as _RootState } from '../../../../reducers';

export type RootState = _RootState;
export type MockRootState = DeepPartial<_RootState>;

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

describe('BasicFunctionalityModal', () => {
  it('should render correctly', () => {
    const { toJSON } = renderWithProvider(
      <BasicFunctionalityModal route={{ params: { caller: 'test' } }} />,
      { state: mockInitialState as unknown as Record<string, unknown> },
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
