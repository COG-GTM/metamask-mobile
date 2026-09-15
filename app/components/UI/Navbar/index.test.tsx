import React from 'react';
import {
  createStackNavigator,
  StackHeaderProps,
} from '@react-navigation/stack';
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import renderWithProvider from '../../../util/test/renderWithProvider';
import { backgroundState } from '../../../util/test/initial-root-state';
import { getNetworkNavbarOptions, NavbarOptions } from '.';

describe('getNetworkNavbarOptions', () => {
  const Stack = createStackNavigator();

  const mockNavigation = {
    pop: jest.fn(),
  } as unknown as NavigationProp<ParamListBase>;

  const TestNavigator = ({ options }: { options: NavbarOptions }) => (
    <Stack.Navigator>
      <Stack.Screen
        name="TestScreen"
        component={() => <>{options.header?.({} as StackHeaderProps)}</>}
      />
    </Stack.Navigator>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with default options', () => {
    const options = getNetworkNavbarOptions(
      'Test Title',
      false,
      mockNavigation,
    );

    const { getByText } = renderWithProvider(
      <TestNavigator options={options} />,
      {
        state: {
          engine: {
            backgroundState: {
              ...backgroundState,
            },
          },
        },
      },
    );

    expect(getByText('Test Title')).toBeTruthy();
  });
});
