/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-shadow, @typescript-eslint/prefer-optional-chain, @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, @typescript-eslint/prefer-for-of, @typescript-eslint/no-explicit-any, import/no-namespace, import/no-named-as-default-member, react/no-unstable-nested-components */
/**
 * This view was created in order to test the navigation api since it's possible it can change even with minor upgrades.
 * For reference see: https://reactnavigation.org/docs/navigation-prop/#dangerouslygetstate
 */

/* eslint-disable react/prop-types */
/* eslint-disable react/no-unstable-nested-components */
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import {
  NavigationContainer,
  useNavigationState,
} from '@react-navigation/native';
import { findRouteNameFromNavigatorState } from '../../../util/general';
import { Text } from 'react-native';

const Stack = createStackNavigator();

// @ts-expect-error -- legacy JavaScript UI type boundary
const TestScreen = ({ route }): Props => {
  const routes = useNavigationState((state) => state.routes);

  const name = findRouteNameFromNavigatorState(routes);

  if (name !== route.params.screenName)
    throw new Error(
      'Error, react navigation api changed: https://reactnavigation.org/docs/navigation-prop/#dangerouslygetstate',
    );

  return <Text>{name} THIS SHOULD NOT HAVE CHANGED, take a deeper look</Text>;
};

const TestSubStack = () => (
  <Stack.Navigator initialRouteName="TestScreen">
    <Stack.Screen
      name="TestScreen3"
      component={TestScreen}
      initialParams={{ screenName: 'TestScreen3' }}
    />
  </Stack.Navigator>
);

// @ts-expect-error -- legacy JavaScript UI type boundary
const TestStack = ({ secondRoute }): Props => (
  <Stack.Navigator initialRouteName={secondRoute || 'TestSubStack'}>
    <Stack.Screen name="TestSubStack" component={TestSubStack} />
    <Stack.Screen
      name="TestScreen2"
      component={TestScreen}
      initialParams={{ screenName: 'TestScreen2' }}
    />
  </Stack.Navigator>
);

// @ts-expect-error -- legacy JavaScript UI type boundary
const NavigationUnitTest = ({ firstRoute, secondRoute }): Props => (
  <NavigationContainer>
    <Stack.Navigator initialRouteName={firstRoute || 'TestStack'}>
      <Stack.Screen name="TestStack" component={TestStack} />
      <Stack.Screen
        name="TestScreen1"
        component={TestScreen}
        initialParams={{ screenName: 'TestScreen1' }}
      />
    </Stack.Navigator>
  </NavigationContainer>
);

// @ts-expect-error -- legacy JavaScript UI type boundary
const NavigationUnitTestFactory = ({ firstRoute, secondRoute }): Props => (
  <NavigationUnitTest firstRoute={firstRoute} secondRoute={secondRoute} />
);

export default NavigationUnitTestFactory;
