/* eslint-disable react/prop-types */
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import renderWithProvider from '../../../util/test/renderWithProvider';
import { backgroundState } from '../../../util/test/initial-root-state';
import { getNetworkNavbarOptions } from '.';

interface TestNavigatorOptions {
  header: () => React.ReactElement;
}

interface TestNavigatorProps {
  options: TestNavigatorOptions;
}

describe('getNetworkNavbarOptions', () => {
  const Stack = createStackNavigator();

  const mockNavigation = {
    pop: jest.fn(),
  };

  const TestNavigator = ({ options }: TestNavigatorProps) => (
    <Stack.Navigator>
      <Stack.Screen name="TestScreen" component={() => options.header()} />
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
      {} as unknown as Parameters<typeof getNetworkNavbarOptions>[3],
    );

    const { getByText } = renderWithProvider(
      <TestNavigator options={options as TestNavigatorOptions} />,
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
