import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import renderWithProvider from '../../../../util/test/renderWithProvider';

jest.mock('./PaymentMethodBadges', () => () => null);
jest.mock('./PaymentMethodIcon', () => () => null);

// eslint-disable-next-line import/first
import PaymentMethod from './PaymentMethod';

// Minimal fixture matching the @consensys/on-ramp-sdk Payment shape used by this component.
const makePayment = (
  overrides: Partial<Record<string, unknown>> = {},
): React.ComponentProps<typeof PaymentMethod>['payment'] =>
  ({
    id: '/payments/debit-credit-card',
    name: 'Debit / Credit card',
    amountTier: [1, 3],
    delay: [0, 5, 'minutes'],
    icons: [],
    logo: null,
    paymentType: 'debit-credit-card',
    detail: undefined,
    disclaimer: null,
    ...overrides,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

describe('PaymentMethod', () => {
  it('renders the payment method name and matches the snapshot', () => {
    const { toJSON, getByText } = renderWithProvider(
      <PaymentMethod payment={makePayment()} isBuy onPress={jest.fn()} />,
    );
    expect(getByText('Debit / Credit card')).toBeDefined();
    expect(toJSON()).toMatchSnapshot();
  });

  it('invokes onPress when the row is pressed', () => {
    const onPress = jest.fn();
    const { getByText } = renderWithProvider(
      <PaymentMethod payment={makePayment()} isBuy onPress={onPress} />,
    );
    fireEvent.press(getByText('Debit / Credit card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders the optional detail line when provided', () => {
    const { getByText } = renderWithProvider(
      <PaymentMethod
        payment={makePayment({ detail: 'Helper text' })}
        isBuy
        onPress={jest.fn()}
      />,
    );
    expect(getByText('Helper text')).toBeDefined();
  });

  it('renders a logo container when the payment has a logo bucket', () => {
    const { toJSON } = renderWithProvider(
      <PaymentMethod
        payment={makePayment({ logo: { light: ['x.png'], dark: ['y.png'] } })}
        isBuy
        compact
      />,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
