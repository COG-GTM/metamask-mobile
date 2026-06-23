import React from 'react';
import { render, screen } from '@testing-library/react-native';
import EnterPasswordSimple from './';
import {
  NavigationContainer,
  ParamListBase,
} from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ThemeContext } from '../../../util/theme';

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
};

const mockNavigation = {
  setOptions: jest.fn(),
  goBack: jest.fn(),
  navigate: jest.fn(),
  route: {
    params: {
      accountAddress: '0x123',
    },
  },
};

describe('EnterPasswordSimple', () => {
  it('should render correctly', () => {
    render(
      <ThemeContext.Provider value={mockTheme}>
        <NavigationContainer>
          <EnterPasswordSimple
            navigation={
              mockNavigation as unknown as StackNavigationProp<ParamListBase>
            }
          />
        </NavigationContainer>
      </ThemeContext.Provider>,
    );
    expect(screen.toJSON()).toMatchSnapshot();
  });
});
