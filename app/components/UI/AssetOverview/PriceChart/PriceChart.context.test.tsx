import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { PriceChartProvider, usePriceChart } from './PriceChart.context';

const Consumer = () => {
  const { isChartBeingTouched, setIsChartBeingTouched } = usePriceChart();
  return (
    <TouchableOpacity onPress={() => setIsChartBeingTouched(!isChartBeingTouched)}>
      <Text testID="state">{String(isChartBeingTouched)}</Text>
    </TouchableOpacity>
  );
};

describe('PriceChart.context', () => {
  it('starts with isChartBeingTouched false inside a provider', () => {
    const { getByTestId } = render(
      <PriceChartProvider>
        <Consumer />
      </PriceChartProvider>,
    );

    expect(getByTestId('state').props.children).toBe('false');
  });

  it('updates state when setIsChartBeingTouched is invoked inside a provider', () => {
    const { getByTestId } = render(
      <PriceChartProvider>
        <Consumer />
      </PriceChartProvider>,
    );

    fireEvent.press(getByTestId('state'));

    expect(getByTestId('state').props.children).toBe('true');
  });

  it('throws a helpful error when setIsChartBeingTouched is called outside of a provider', () => {
    const { getByTestId } = render(<Consumer />);

    expect(() => fireEvent.press(getByTestId('state'))).toThrow(
      /no PriceChartProvider was found/,
    );
  });
});
