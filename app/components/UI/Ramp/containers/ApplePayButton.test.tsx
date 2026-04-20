import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import renderWithProvider from '../../../../util/test/renderWithProvider';

const mockDispatch = jest.fn();
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
  useSelector: (fn: (state: unknown) => unknown) =>
    fn({ settings: { lockTime: 10_000 } }),
}));

const mockPay = jest.fn();
const mockABORTED = Symbol('ABORTED');
jest.mock('../hooks/useApplePay', () => ({
  __esModule: true,
  default: () => [mockPay],
  ABORTED: mockABORTED,
}));

const mockHandleSuccessfulOrder = jest.fn();
jest.mock(
  '../hooks/useHandleSuccessfulOrder',
  () => () => mockHandleSuccessfulOrder,
);

jest.mock('../sdk', () => ({
  useRampSDK: () => ({
    selectedAddress: '0xabc',
    selectedChainId: '0x1',
    callbackBaseUrl: 'https://cb.example/',
  }),
}));

jest.mock('../orderProcessor/aggregator', () => ({
  aggregatorOrderToFiatOrder: jest.fn((order) => ({
    id: order.id,
    provider: order.provider,
    state: order.state,
  })),
}));

jest.mock('../../../../core/NotificationManager', () => ({
  showSimpleNotification: jest.fn(),
}));

jest.mock('../components/ApplePayButton', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
  const { TouchableOpacity, Text } = require('react-native');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ({ label, onPress }: any) => (
    <TouchableOpacity onPress={onPress}>
      <Text>{label}</Text>
    </TouchableOpacity>
  );
});

// eslint-disable-next-line import/first
import ApplePayButton from './ApplePayButton';
// eslint-disable-next-line import/first
import { setLockTime } from '../../../../actions/settings';
// eslint-disable-next-line import/first
import { addAuthenticationUrl } from '../../../../reducers/fiatOrders';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const quote: any = {
  crypto: { symbol: 'ETH' },
};

describe('ApplePayButton container', () => {
  beforeEach(() => {
    mockDispatch.mockClear();
    mockPay.mockReset();
    mockHandleSuccessfulOrder.mockReset();
  });

  it('renders the underlying ApplePayButton component with the provided label', () => {
    const { getByText, toJSON } = renderWithProvider(
      <ApplePayButton quote={quote} label="Pay" />,
    );
    expect(getByText('Pay')).toBeDefined();
    expect(toJSON()).toMatchSnapshot();
  });

  it('does nothing beyond toggling lock time when the payment is aborted', async () => {
    mockPay.mockResolvedValue(mockABORTED);
    const { getByText } = renderWithProvider(
      <ApplePayButton quote={quote} label="Pay" />,
    );
    await fireEvent.press(getByText('Pay'));
    expect(mockDispatch).toHaveBeenCalledWith(setLockTime(-1));
    expect(mockHandleSuccessfulOrder).not.toHaveBeenCalled();
  });

  it('dispatches an authentication url and forwards the order on a successful payment', async () => {
    mockPay.mockResolvedValue({
      authenticationUrl: 'https://auth.example/?x=1',
      order: { id: 'aggregator-1', provider: 'p', state: 'CREATED' },
    });
    const { getByText } = renderWithProvider(
      <ApplePayButton quote={quote} label="Pay" />,
    );
    await fireEvent.press(getByText('Pay'));
    // authentication URL action dispatched
    expect(mockDispatch).toHaveBeenCalledWith(
      addAuthenticationUrl(expect.stringContaining('autoRedirect=true')),
    );
    expect(mockHandleSuccessfulOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'aggregator-1',
        network: '0x1',
        account: '0xabc',
      }),
      { isApplePay: true },
    );
  });
});
