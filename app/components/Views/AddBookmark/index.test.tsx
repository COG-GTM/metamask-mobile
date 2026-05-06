import React from 'react';
import { screen, render } from '@testing-library/react-native';
import AddBookmark from './';
import { ThemeContext } from '../../../util/theme';
import type { ParamListBase, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

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
      <ThemeContext.Provider value={mockTheme}>
        <AddBookmark
          navigation={
            { setOptions: () => null } as unknown as StackNavigationProp<ParamListBase>
          }
          route={
            {
              params: {
                onAddBookmark: () => undefined,
              },
            } as RouteProp<
              {
                params: {
                  title?: string;
                  url?: string;
                  onAddBookmark: (bookmark: {
                    name: string;
                    url: string;
                  }) => void;
                };
              },
              'params'
            >
          }
        />
      </ThemeContext.Provider>,
    );
    expect(screen.toJSON()).toMatchSnapshot();
  });
});
