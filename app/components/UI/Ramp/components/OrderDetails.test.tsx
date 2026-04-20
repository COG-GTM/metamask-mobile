import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { Linking } from 'react-native';
import renderWithProvider from '../../../../util/test/renderWithProvider';
import { FIAT_ORDER_STATES } from '../../../../constants/on-ramp';

jest.mock('./Account', () => () => null);
jest.mock('../../AnimatedSpinner', () => () => null);
jest.mock('../../Swaps/utils/useBlockExplorer', () => () => ({
  tx: (hash: string) => `https://etherscan.io/tx/${hash}`,
  isValid: true,
  name: 'Etherscan',
}));

const mockTrackEvent = jest.fn();
jest.mock('../hooks/useAnalytics', () => () => mockTrackEvent);

// eslint-disable-next-line import/first
import OrderDetails from './OrderDetails';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeOrder = (overrides: Partial<any> = {}): any => ({
  id: 'order-1',
  provider: 'AGGREGATOR',
  createdAt: 1700000000000,
  amount: 100,
  fee: 1,
  cryptoFee: 2,
  cryptoAmount: 0.05,
  currency: 'USD',
  currencySymbol: '$',
  cryptocurrency: 'ETH',
  state: FIAT_ORDER_STATES.COMPLETED,
  account: '0x1111111111111111111111111111111111111111',
  txHash: '0xhash',
  orderType: 'BUY',
  data: {
    providerOrderId: 'prov-order-xyz',
    exchangeRate: 2000,
    statusDescription: 'all good',
    fiatCurrency: { decimals: 2 },
    cryptoCurrency: { decimals: 18 },
    paymentMethod: { name: 'Credit Card' },
    provider: {
      name: 'TestProvider',
      links: [
        { name: 'SUPPORT', url: 'https://provider.example/support' },
      ],
    },
    providerOrderLink: 'https://provider.example/tracking',
  },
  ...overrides,
});

describe('OrderDetails', () => {
  beforeEach(() => {
    mockTrackEvent.mockClear();
  });

  it('renders a completed order with its main fields', () => {
    const { getByText, toJSON } = renderWithProvider(
      <OrderDetails order={makeOrder()} />,
    );
    expect(getByText('prov-order-xyz')).toBeDefined();
    expect(toJSON()).toMatchSnapshot();
  });

  it('opens the block explorer for a completed order with a tx hash', () => {
    const openURLSpy = jest
      .spyOn(Linking, 'openURL')
      .mockImplementation(() => Promise.resolve());
    const { getByText } = renderWithProvider(
      <OrderDetails order={makeOrder()} />,
    );
    fireEvent.press(getByText(/Etherscan/));
    expect(openURLSpy).toHaveBeenCalledWith(
      expect.stringContaining('https://etherscan.io/tx/0xhash'),
    );
    expect(mockTrackEvent).toHaveBeenCalledWith(
      'ONRAMP_EXTERNAL_LINK_CLICKED',
      expect.objectContaining({ location: 'Order Details Screen' }),
    );
    openURLSpy.mockRestore();
  });

  it('renders the failed-state stage when the order is FAILED', () => {
    const { toJSON } = renderWithProvider(
      <OrderDetails
        order={makeOrder({ state: FIAT_ORDER_STATES.FAILED, txHash: null })}
      />,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
