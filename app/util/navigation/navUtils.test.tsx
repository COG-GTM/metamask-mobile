import React from 'react';
import { Text } from 'react-native';
import { renderHook } from '@testing-library/react-hooks';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { render } from '@testing-library/react-native';
import { createNavigationDetails, useParams } from './navUtils';

describe('createNavigationDetails', () => {
  it('returns [name, params] when no screen is provided', () => {
    const go = createNavigationDetails<{ id: string }>('Screen');
    expect(go({ id: '1' })).toEqual(['Screen', { id: '1' }]);
  });

  it('wraps params under screen when a screen name is provided', () => {
    const go = createNavigationDetails<{ id: string }>('Stack', 'Screen');
    expect(go({ id: '1' })).toEqual([
      'Stack',
      { screen: 'Screen', params: { id: '1' } },
    ]);
  });

  it('passes undefined params through when no params are given', () => {
    const go = createNavigationDetails<{ id?: string }>('Screen');
    expect(go()).toEqual(['Screen', undefined]);
  });
});

describe('useParams', () => {
  const Stack = createStackNavigator();
  const renderWithParams = (
    params: { id: string; name?: string } | undefined,
    defaults?: Partial<{ id: string; name?: string }>,
  ) => {
    const Probe = () => {
      const merged = useParams<{ id: string; name?: string }>(defaults);
      return <Text testID="out">{JSON.stringify(merged)}</Text>;
    };
    return render(
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name="Test"
            component={Probe}
            initialParams={params}
          />
        </Stack.Navigator>
      </NavigationContainer>,
    );
  };

  it('returns route params merged over defaults', () => {
    const { getByTestId } = renderWithParams(
      { id: '42', name: 'override' },
      { name: 'default', id: 'default-id' },
    );
    expect(JSON.parse(getByTestId('out').props.children)).toEqual({
      id: '42',
      name: 'override',
    });
  });

  it('falls back to defaults when a param is missing', () => {
    const { getByTestId } = renderWithParams(
      { id: '42' },
      { name: 'default' },
    );
    expect(JSON.parse(getByTestId('out').props.children)).toEqual({
      id: '42',
      name: 'default',
    });
  });

  // renderHook exists for completeness; not strictly necessary here but demonstrates
  // the hook integrates with the navigation provider the same way.
  it('can be wrapped with renderHook when needed', () => {
    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name="Test"
            initialParams={{ id: 'x' }}
            component={() => <>{children}</>}
          />
        </Stack.Navigator>
      </NavigationContainer>
    );
    const { result } = renderHook(() => useParams<{ id: string }>(), {
      wrapper,
    });
    expect(result.current).toEqual({ id: 'x' });
  });
});
