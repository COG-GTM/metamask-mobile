/**
 * This view was created in order to test the navigation api since it's possible it can change even with minor upgrades.
 * For reference see: https://reactnavigation.org/docs/navigation-prop/#dangerouslygetstate
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import {
  NavigationContainer,
  useNavigationState,
  RouteProp,
} from '@react-navigation/native';
import { findRouteNameFromNavigatorState } from '../../../util/general';
import { Text } from 'react-native';

type RootStackParamList = {
  TestStack: undefined;
  TestScreen1: { screenName: string };
  TestSubStack: undefined;
  TestScreen2: { screenName: string };
  TestScreen3: { screenName: string };
};

const Stack = createStackNavigator<RootStackParamList>();

interface TestScreenProps {
  route: RouteProp<RootStackParamList, 'TestScreen1' | 'TestScreen2' | 'TestScreen3'>;
}

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
  <Stack.Navigator initialRouteName="TestScreen3">
    <Stack.Screen
      name="TestScreen3"
      component={TestScreen}
      initialParams={{ screenName: 'TestScreen3' }}
    />
  </Stack.Navigator>
);

interface TestStackProps {
  secondRoute?: string;
}

const TestStack = ({ secondRoute }: TestStackProps) => (
  <Stack.Navigator initialRouteName={(secondRoute as keyof RootStackParamList) || 'TestSubStack'}>
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

const NavigationUnitTest = ({ firstRoute, secondRoute }: NavigationUnitTestProps) => (
  <NavigationContainer>
    <Stack.Navigator initialRouteName={(firstRoute as keyof RootStackParamList) || 'TestStack'}>
      <Stack.Screen name="TestStack">
        {() => <TestStack secondRoute={secondRoute} />}
      </Stack.Screen>
      <Stack.Screen
        name="TestScreen1"
        component={TestScreen}
        initialParams={{ screenName: 'TestScreen1' }}
      />
    </Stack.Navigator>
  </NavigationContainer>
);

const NavigationUnitTestFactory = ({ firstRoute, secondRoute }: NavigationUnitTestProps) => (
  <NavigationUnitTest firstRoute={firstRoute} secondRoute={secondRoute} />
);

export default NavigationUnitTestFactory;
