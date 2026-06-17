import React from 'react';
import { render, screen } from '@testing-library/react-native';
import EnterPasswordSimple from './';
import {
  NavigationContainer,
  ParamListBase,
  RouteProp,
} from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ThemeContext } from '../../../util/theme';
import { Theme } from '../../../util/theme/models';

const mockTheme = {
  colors: {
    background: { default: 'white' },
    border: { default: 'red' },
    text: { default: 'black' },
    primary: { default: 'blue' },
    warning: { default: 'yellow' },
    error: { default: 'red' },
    overlay: { default: 'white' },
  },
  themeAppearance: 'light',
} as unknown as Theme;

const mockNavigation = {
  setOptions: jest.fn(),
  goBack: jest.fn(),
  navigate: jest.fn(),
  pop: jest.fn(),
} as unknown as StackNavigationProp<ParamListBase>;

const mockRoute = {
  params: {
    onPasswordSet: jest.fn(),
  },
} as unknown as RouteProp<
  { params: { onPasswordSet: (password: string) => void } },
  'params'
>;

describe('EnterPasswordSimple', () => {
  it('should render correctly', () => {
    render(
      <ThemeContext.Provider value={mockTheme}>
        <NavigationContainer>
          <EnterPasswordSimple
            navigation={mockNavigation}
            route={mockRoute}
          />
        </NavigationContainer>
      </ThemeContext.Provider>,
    );
    expect(screen.toJSON()).toMatchSnapshot();
  });
});
