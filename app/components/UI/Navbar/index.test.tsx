import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import renderWithProvider from '../../../util/test/renderWithProvider';
import { backgroundState } from '../../../util/test/initial-root-state';
import { getNetworkNavbarOptions } from '.';

interface TestNavigatorProps {
  options: { header: () => React.ReactElement };
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
    const options = (
      getNetworkNavbarOptions as unknown as (
        title: string,
        translate: boolean,
        navigation: typeof mockNavigation,
      ) => TestNavigatorProps['options']
    )('Test Title', false, mockNavigation);

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
