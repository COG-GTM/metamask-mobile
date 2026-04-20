import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Keypad from './Keypad';

describe('Keypad', () => {
  it('renders with default styles', () => {
    const { toJSON } = render(
      <Keypad value="0" onChange={jest.fn()} currency="USD" decimals={2} />,
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('forwards key presses to onChange', () => {
    const onChange = jest.fn();
    const { getByText } = render(
      <Keypad value="0" onChange={onChange} currency="USD" decimals={2} />,
    );
    fireEvent.press(getByText('1'));
    expect(onChange).toHaveBeenCalled();
  });
});
