import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import QuickAmounts from './QuickAmounts';
import { QuickAmount } from '../types';

describe('QuickAmounts', () => {
  const amounts: QuickAmount[] = [
    { value: 100, label: '$100' },
    { value: 200, label: '$200' },
    { value: 1, label: '100%', isNative: true },
  ];

  it('renders a button for every provided amount', () => {
    const { toJSON, getByText } = render(
      <QuickAmounts amounts={amounts} onAmountPress={jest.fn()} isBuy />,
    );
    expect(getByText('$100')).toBeDefined();
    expect(getByText('$200')).toBeDefined();
    expect(getByText('100%')).toBeDefined();
    expect(toJSON()).toMatchSnapshot();
  });

  it('invokes onAmountPress with the pressed amount', () => {
    const onAmountPress = jest.fn();
    const { getByText } = render(
      <QuickAmounts amounts={amounts} onAmountPress={onAmountPress} isBuy />,
    );
    fireEvent.press(getByText('$200'));
    expect(onAmountPress).toHaveBeenCalledWith(amounts[1]);
  });

  it('renders the sparkle icon for the full native sell amount', () => {
    const { toJSON } = render(
      <QuickAmounts
        amounts={amounts}
        onAmountPress={jest.fn()}
        isBuy={false}
      />,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
