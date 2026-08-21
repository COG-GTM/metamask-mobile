/**
 * This view was created in order to test the navigation api since it's possible it can change even with minor upgrades.
 * For reference see: https://reactnavigation.org/docs/navigation-prop/#dangerouslygetstate
 */

/* eslint-disable react/no-unstable-nested-components */
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import {
  NavigationContainer,
  RouteProp,
  useNavigationState,
} from '@react-navigation/native';
import { findRouteNameFromNavigatorState } from '../../../util/general';
import { Text } from 'react-native';

interface TestScreenParams {
  screenName: string;
}

type TestScreenName = 'TestScreen1' | 'TestScreen2' | 'TestScreen3';

type TestStackParamList = {
  TestStack: undefined;
  TestSubStack: undefined;
  TestScreen: undefined;
} & Record<TestScreenName, TestScreenParams>;

interface TestScreenProps {
  route: RouteProp<TestStackParamList, TestScreenName>;
}

interface NavigationUnitTestProps {
  firstRoute?: keyof TestStackParamList;
  secondRoute?: keyof TestStackParamList;
}

const Stack = createStackNavigator<TestStackParamList>();

const TestScreen = ({ route }: TestScreenProps) => {
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

const TestStack = ({
  secondRoute,
}: Pick<NavigationUnitTestProps, 'secondRoute'>) => (
  <Stack.Navigator initialRouteName={secondRoute || 'TestSubStack'}>
    <Stack.Screen name="TestSubStack" component={TestSubStack} />
    <Stack.Screen
      name="TestScreen2"
      component={TestScreen}
      initialParams={{ screenName: 'TestScreen2' }}
    />
  </Stack.Navigator>
);

const NavigationUnitTest = ({ firstRoute }: NavigationUnitTestProps) => (
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
