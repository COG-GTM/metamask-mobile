import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import AmountInput from './AmountInput';
import { BuildQuoteSelectors } from '../../../../../e2e/selectors/Ramps/BuildQuote.selectors';

describe('AmountInput', () => {
  it('renders with label, currency symbol and amount', () => {
    const { toJSON, getByText } = render(
      <AmountInput
        label="You pay"
        currencySymbol="$"
        amount="100"
        currencyCode="USD"
        onCurrencyPress={jest.fn()}
      />,
    );
    expect(getByText('You pay')).toBeDefined();
    expect(getByText('$100')).toBeDefined();
    expect(getByText('USD')).toBeDefined();
    expect(toJSON()).toMatchSnapshot();
  });

  it('does not render the currency picker when onCurrencyPress is absent', () => {
    const { queryByTestId } = render(<AmountInput amount="25" />);
    expect(queryByTestId(BuildQuoteSelectors.SELECT_CURRENCY)).toBeNull();
  });

  it('fires the press handlers', () => {
    const onPress = jest.fn();
    const onCurrencyPress = jest.fn();
    const { getByTestId } = render(
      <AmountInput
        amount="25"
        onPress={onPress}
        onCurrencyPress={onCurrencyPress}
        currencyCode="USD"
      />,
    );
    fireEvent.press(getByTestId(BuildQuoteSelectors.AMOUNT_INPUT));
    fireEvent.press(getByTestId(BuildQuoteSelectors.SELECT_CURRENCY));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onCurrencyPress).toHaveBeenCalledTimes(1);
  });
});
