import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import renderWithProvider from '../../../../util/test/renderWithProvider';
import { RampType } from '../types';

jest.mock('react-native-modal', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ({ children, isVisible }: any) =>
    isVisible ? <View>{children}</View> : null;
});

const mockTrackEvent = jest.fn();
jest.mock('../hooks/useAnalytics', () => () => mockTrackEvent);

jest.mock('./PaymentMethod', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
  const { TouchableOpacity, Text } = require('react-native');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ({ payment, onPress }: any) => (
    <TouchableOpacity onPress={onPress}>
      <Text>{payment.name}</Text>
    </TouchableOpacity>
  );
});

// eslint-disable-next-line import/first
import PaymentMethodModal from './PaymentMethodModal';

const paymentMethods = [
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { id: '/payments/a', name: 'Payment A' } as any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { id: '/payments/b', name: 'Payment B' } as any,
];

describe('PaymentMethodModal', () => {
  beforeEach(() => {
    mockTrackEvent.mockClear();
  });

  it('does not render payment rows when the modal is hidden', () => {
    const { queryByText } = renderWithProvider(
      <PaymentMethodModal
        isVisible={false}
        dismiss={jest.fn()}
        onItemPress={jest.fn()}
        paymentMethods={paymentMethods}
        selectedPaymentMethodId={null}
        selectedPaymentMethodType={undefined}
        rampType={RampType.BUY}
      />,
    );
    expect(queryByText('Payment A')).toBeNull();
  });

  it('renders the payment methods and forwards selection events', () => {
    const onItemPress = jest.fn();
    const { getByText, toJSON } = renderWithProvider(
      <PaymentMethodModal
        isVisible
        dismiss={jest.fn()}
        onItemPress={onItemPress}
        paymentMethods={paymentMethods}
        selectedPaymentMethodId="/payments/a"
        selectedPaymentMethodType={undefined}
        rampType={RampType.BUY}
        location="Amount to Buy Screen"
      />,
    );
    expect(toJSON()).toMatchSnapshot();
    fireEvent.press(getByText('Payment B'));
    expect(onItemPress).toHaveBeenCalledWith('/payments/b');
    expect(mockTrackEvent).toHaveBeenCalledWith(
      'ONRAMP_PAYMENT_METHOD_SELECTED',
      expect.objectContaining({ payment_method_id: '/payments/b' }),
    );
  });

  it('invokes onItemPress without an id when tapping the already-selected method', () => {
    const onItemPress = jest.fn();
    const { getByText } = renderWithProvider(
      <PaymentMethodModal
        isVisible
        dismiss={jest.fn()}
        onItemPress={onItemPress}
        paymentMethods={paymentMethods}
        selectedPaymentMethodId="/payments/a"
        selectedPaymentMethodType={undefined}
        rampType={RampType.BUY}
      />,
    );
    fireEvent.press(getByText('Payment A'));
    expect(onItemPress).toHaveBeenCalledWith();
    expect(mockTrackEvent).not.toHaveBeenCalled();
  });

  it('fires an OFFRAMP analytics event for sell flow selections', () => {
    const onItemPress = jest.fn();
    const { getByText } = renderWithProvider(
      <PaymentMethodModal
        isVisible
        dismiss={jest.fn()}
        onItemPress={onItemPress}
        paymentMethods={paymentMethods}
        selectedPaymentMethodId={null}
        selectedPaymentMethodType={undefined}
        rampType={RampType.SELL}
      />,
    );
    fireEvent.press(getByText('Payment B'));
    expect(mockTrackEvent).toHaveBeenCalledWith(
      'OFFRAMP_PAYMENT_METHOD_SELECTED',
      expect.objectContaining({ payment_method_id: '/payments/b' }),
    );
  });
});
