import React from 'react';
import { render } from '@testing-library/react-native';
import { PaymentType } from '@consensys/on-ramp-sdk';
import { PaymentIconType } from '@consensys/on-ramp-sdk/dist/API';
import PaymentMethodIcon from './PaymentMethodIcon';

describe('PaymentMethodIcon', () => {
  it('renders the default wallet icon when no data is provided', () => {
    const { toJSON } = render(<PaymentMethodIcon size={24} />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders the apple icon for ApplePay payment type', () => {
    const { toJSON } = render(
      <PaymentMethodIcon paymentMethodType={PaymentType.ApplePay} size={24} />,
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders the bank icon for BankTransfer payment type', () => {
    const { toJSON } = render(
      <PaymentMethodIcon
        paymentMethodType={PaymentType.BankTransfer}
        size={24}
      />,
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders the card icon for DebitCreditCard payment type', () => {
    const { toJSON } = render(
      <PaymentMethodIcon
        paymentMethodType={PaymentType.DebitCreditCard}
        size={24}
      />,
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders an icon from the provided paymentMethodIcons when it exists in the glyph map', () => {
    const { toJSON } = render(
      <PaymentMethodIcon
        paymentMethodIcons={[
          { type: PaymentIconType.FontAwesome, name: 'bank' },
        ]}
        size={24}
      />,
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('falls back to payment type when the provided icon name is unknown', () => {
    const { toJSON } = render(
      <PaymentMethodIcon
        paymentMethodIcons={[
          {
            type: PaymentIconType.FontAwesome,
            name: 'definitely-not-an-icon',
          },
        ]}
        paymentMethodType={PaymentType.GooglePay}
        size={24}
      />,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
