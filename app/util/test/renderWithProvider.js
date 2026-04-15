import React from 'react';
import { Provider } from 'react-redux';

import { NavigationContainer } from '@react-navigation/native';
import {
  createStackNavigator } from

'@react-navigation/stack';
import {
  render,
  renderHook } from

'@testing-library/react-native';

import { mockTheme, ThemeContext } from '../theme';

import configureStore from './configureStore';


// DeepPartial is a generic type that recursively makes all properties of a given type T optional
















export default function renderWithProvider(
component,
providerValues,
includeNavigationContainer = true)
{
  const { state = {}, theme = mockTheme } = providerValues ?? {};
  const store = configureStore(state);
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  require('../../store')._updateMockState(state);

  const InnerProvider = ({ children }) =>
  <Provider store={store}>
      <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
    </Provider>;


  const AllProviders = ({ children }) => {
    if (includeNavigationContainer) {
      return (
        <NavigationContainer>
          <InnerProvider>{children}</InnerProvider>
        </NavigationContainer>);

    }
    return <InnerProvider>{children}</InnerProvider>;
  };

  return { ...render(component, { wrapper: AllProviders }), store };
}

export function renderScreen(
Component,
options,



providerValues,
// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
initialParams = {})
{
  const Stack = createStackNavigator();
  return renderWithProvider(
    <Stack.Navigator>
      <Stack.Screen
        name={options.name}
        options={options.options}
        component={Component}
        initialParams={initialParams}>
      </Stack.Screen>
    </Stack.Navigator>,
    providerValues
  );
}

export function renderHookWithProvider(
hook,
providerValues)
{
  const { state = {} } = providerValues ?? {};
  const store = configureStore(state);
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  require('../../store')._updateMockState(state);
  const Providers = ({ children }) =>
  <Provider store={store}>{children}</Provider>;


  return {
    ...renderHook(hook, { wrapper: Providers }),
    store
  };
}