import React from 'react';
import { screen, render } from '@testing-library/react-native';
import AddBookmark from './';
import { ThemeContext } from '../../../util/theme';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { ParamListBase, RouteProp } from '@react-navigation/native';
import type { AddBookmarkParams } from './index';
import type { Theme } from '../../../util/theme/models';

const mockTheme = {
  colors: {
    background: { default: 'white' },
    border: { default: 'red' },
    text: { default: 'black' },
    error: { default: 'red' },
    warning: { default: 'yellow' },
    primary: { default: 'blue', inverse: 'orange' },
    overlay: { inverse: 'blue' },
  },
  themeAppearance: 'light',
};

describe('AddBookmark', () => {
  it('should render correctly', () => {
    render(
      <ThemeContext.Provider value={mockTheme as unknown as Theme}>
        <AddBookmark
          navigation={
            {
              setOptions: () => null,
            } as unknown as StackNavigationProp<ParamListBase>
          }
          route={
            { params: {} } as unknown as RouteProp<
              { params: AddBookmarkParams },
              'params'
            >
          }
        />
      </ThemeContext.Provider>,
    );
    expect(screen.toJSON()).toMatchSnapshot();
  });
});
