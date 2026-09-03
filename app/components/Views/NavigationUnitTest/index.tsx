/**
 * This view was created in order to test the navigation api since it's possible it can change even with minor upgrades.
 * For reference see: https://reactnavigation.org/docs/navigation-prop/#dangerouslygetstate
 */

/* eslint-disable react/no-unstable-nested-components */
import React from 'react';
import {
  createStackNavigator,
  type StackScreenProps,
} from '@react-navigation/stack';
import {
  NavigationContainer,
  ParamListBase,
  useNavigationState,
} from '@react-navigation/native';
import { hasProperty, isObject } from '@metamask/utils';
import { findRouteNameFromNavigatorState } from '../../../util/general';
import { Text } from 'react-native';

const Stack = createStackNavigator();

const TestScreen = ({ route }: StackScreenProps<ParamListBase>) => {
  const routes = useNavigationState((state) => state.routes);

  const name = findRouteNameFromNavigatorState(routes);
  const screenName =
    isObject(route.params) &&
    hasProperty(route.params, 'screenName') &&
    typeof route.params.screenName === 'string'
      ? route.params.screenName
      : undefined;

  if (name !== screenName)
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

const TestStack = ({ secondRoute }: { secondRoute?: string }) => (
  <Stack.Navigator initialRouteName={secondRoute || 'TestSubStack'}>
    <Stack.Screen name="TestSubStack" component={TestSubStack} />
    <Stack.Screen
      name="TestScreen2"
      component={TestScreen}
      initialParams={{ screenName: 'TestScreen2' }}
    />
  </Stack.Navigator>
);

interface NavigationUnitTestProps {
  firstRoute?: string;
  secondRoute?: string;
}

const NavigationUnitTest = ({
  firstRoute,
  secondRoute: _secondRoute,
}: NavigationUnitTestProps) => (
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

const NavigationUnitTestFactory = ({
  firstRoute,
  secondRoute,
}: NavigationUnitTestProps) => (
  <NavigationUnitTest firstRoute={firstRoute} secondRoute={secondRoute} />
);

export default NavigationUnitTestFactory;
