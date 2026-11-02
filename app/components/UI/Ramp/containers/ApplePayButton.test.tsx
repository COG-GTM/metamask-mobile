import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { QuoteResponse } from '@consensys/on-ramp-sdk';
import ApplePayButton from './ApplePayButton';
import { isAutoLockSuppressed } from '../../../../core/LockManagerService/autoLockSuppression';
import NotificationManager from '../../../../core/NotificationManager';

const mockDispatch = jest.fn();
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
}));

jest.mock('../components/ApplePayButton', () => {
  const { TouchableOpacity, Text } = jest.requireActual('react-native');
  return ({ label, onPress }: { label: string; onPress: () => void }) => (
    <TouchableOpacity testID="apple-pay-button" onPress={onPress}>
      <Text>{label}</Text>
    </TouchableOpacity>
  );
});

const mockPay = jest.fn();
jest.mock('../hooks/useApplePay', () => ({
  __esModule: true,
  ABORTED: 'ABORTED',
  default: () => [mockPay],
}));

jest.mock('../sdk', () => ({
  useRampSDK: () => ({
    selectedAddress: '0x123',
    selectedChainId: '1',
    callbackBaseUrl: 'https://callback.test',
  }),
}));

const mockHandleSuccessfulOrder = jest.fn();
jest.mock(
  '../hooks/useHandleSuccessfulOrder',
  () => () => mockHandleSuccessfulOrder,
);

jest.mock('../../../../core/NotificationManager', () => ({
  showSimpleNotification: jest.fn(),
}));

jest.mock('../../../../util/Logger', () => ({
  error: jest.fn(),
}));

const quote = { crypto: { symbol: 'ETH' } } as unknown as QuoteResponse;

describe('ApplePayButton container', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('suppresses auto-lock in memory during payment without writing lockTime', async () => {
    let suppressedDuringPay = false;
    mockPay.mockImplementationOnce(async () => {
      suppressedDuringPay = isAutoLockSuppressed();
      return 'ABORTED';
    });
    const { getByTestId } = render(
      <ApplePayButton quote={quote} label="Pay" />,
    );

    fireEvent.press(getByTestId('apple-pay-button'));

    await waitFor(() => expect(mockPay).toHaveBeenCalled());
    await waitFor(() => expect(isAutoLockSuppressed()).toBe(false));
    expect(suppressedDuringPay).toBe(true);
    expect(mockDispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'SET_LOCK_TIME' }),
    );
  });

  it('releases auto-lock suppression when payment fails', async () => {
    mockPay.mockRejectedValueOnce(new Error('payment failed'));
    const { getByTestId } = render(
      <ApplePayButton quote={quote} label="Pay" />,
    );

    fireEvent.press(getByTestId('apple-pay-button'));

    await waitFor(() =>
      expect(NotificationManager.showSimpleNotification).toHaveBeenCalled(),
    );
    expect(isAutoLockSuppressed()).toBe(false);
    expect(mockDispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'SET_LOCK_TIME' }),
    );
  });
});
