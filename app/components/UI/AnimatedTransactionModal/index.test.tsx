import React from 'react';
import { render, screen } from '@testing-library/react-native';
import AnimatedTransactionModal from './';
import { View } from 'react-native';
import { ThemeContext } from '../../../util/theme';

const mockTheme = {
  colors: { background: { default: 'white' } },
  themeAppearance: 'light',
};

describe('AnimatedTransactionModal', () => {
  it('should render correctly', () => {
    const mockReview = jest.fn();
    const mockOnModeChange = jest.fn();

    render(
      <ThemeContext.Provider value={mockTheme}>
        <AnimatedTransactionModal
          review={mockReview}
          onModeChange={mockOnModeChange}
          ready
        >
          <View />
        </AnimatedTransactionModal>
      </ThemeContext.Provider>,
    );
    expect(screen.toJSON()).toMatchSnapshot();
  });
});
