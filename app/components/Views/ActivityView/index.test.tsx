import React from 'react';
import ActivityView from '.';
import { backgroundState } from '../../../util/test/initial-root-state';
import renderWithProvider, {
  type DeepPartial,
} from '../../../util/test/renderWithProvider';
import type { RootState } from '../../../reducers';
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();

jest.mock('../../../core/Engine', () => ({
  context: {
    KeyringController: {
      getOrAddQRKeyring: jest.fn(),
    },
  },
  controllerMessenger: {
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
  },
}));

const renderComponent = (state: DeepPartial<RootState> = {}) =>
  renderWithProvider(
    <Stack.Navigator>
      <Stack.Screen name="Amount" options={{}}>
        {() => <ActivityView />}
      </Stack.Screen>
    </Stack.Navigator>,
    { state },
  );

const mockInitialState = {
  wizard: {
    step: 1,
  },
  engine: {
    backgroundState,
  },
};

describe('ActivityView', () => {
  it('should render correctly', () => {
    const { toJSON } = renderComponent(mockInitialState);
    expect(toJSON()).toMatchSnapshot();
  });
});
