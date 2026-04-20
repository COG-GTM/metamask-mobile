import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import QuickAmounts from './QuickAmounts';
import renderWithProvider from '../../../../util/test/renderWithProvider';

describe('QuickAmounts', () => {
  const amounts = [
    { value: 0.25, label: '25%' },
    { value: 0.5, label: '50%' },
    { value: 1, label: 'MAX' },
  ];

  it('renders every provided amount and matches snapshot', () => {
    const { getByText, toJSON } = renderWithProvider(
      <QuickAmounts
        amounts={amounts}
        onAmountPress={jest.fn()}
        onMaxPress={jest.fn()}
      />,
    );

    amounts.forEach(({ label }) => {
      expect(getByText(label)).toBeDefined();
    });

    expect(toJSON()).toMatchSnapshot();
  });

  it('invokes onAmountPress for non-max amounts', () => {
    const onAmountPress = jest.fn();
    const onMaxPress = jest.fn();
    const { getByText } = renderWithProvider(
      <QuickAmounts
        amounts={amounts}
        onAmountPress={onAmountPress}
        onMaxPress={onMaxPress}
      />,
    );

    fireEvent.press(getByText('25%'));

    expect(onAmountPress).toHaveBeenCalledWith(amounts[0]);
    expect(onMaxPress).not.toHaveBeenCalled();
  });

  it('invokes onMaxPress when the MAX (value=1) amount is pressed', () => {
    const onAmountPress = jest.fn();
    const onMaxPress = jest.fn();
    const { getByText } = renderWithProvider(
      <QuickAmounts
        amounts={amounts}
        onAmountPress={onAmountPress}
        onMaxPress={onMaxPress}
      />,
    );

    fireEvent.press(getByText('MAX'));

    expect(onMaxPress).toHaveBeenCalledTimes(1);
    expect(onAmountPress).not.toHaveBeenCalled();
  });

  it('falls back to onAmountPress for MAX when onMaxPress is not provided', () => {
    const onAmountPress = jest.fn();
    const { getByText } = renderWithProvider(
      <QuickAmounts amounts={amounts} onAmountPress={onAmountPress} />,
    );

    fireEvent.press(getByText('MAX'));

    expect(onAmountPress).toHaveBeenCalledWith(amounts[2]);
  });
});
