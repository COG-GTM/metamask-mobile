import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import ChartNavigationButton from './ChartNavigationButton';

describe('ChartNavigationButton', () => {
  it('renders the provided label and matches snapshot', () => {
    const { getByText, toJSON } = render(
      <ChartNavigationButton label="1D" selected={false} onPress={jest.fn()} />,
    );

    expect(getByText('1D')).toBeDefined();
    expect(toJSON()).toMatchSnapshot();
  });

  it('invokes onPress when the button is pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <ChartNavigationButton label="1W" selected={false} onPress={onPress} />,
    );

    fireEvent.press(getByText('1W'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('still renders the label when the button is marked as selected', () => {
    const { getByText } = render(
      <ChartNavigationButton label="1M" selected onPress={jest.fn()} />,
    );

    expect(getByText('1M')).toBeDefined();
  });
});
