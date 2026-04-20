import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import renderWithProvider from '../../../../util/test/renderWithProvider';

jest.mock('../../StyledButton', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
  const { TouchableOpacity, Text } = require('react-native');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ({ onPress, children }: any) => (
    <TouchableOpacity onPress={onPress}>
      <Text>{children}</Text>
    </TouchableOpacity>
  );
});

// eslint-disable-next-line import/first
import ErrorView from './ErrorView';

const mockTrackEvent = jest.fn();
jest.mock('../hooks/useAnalytics', () => () => mockTrackEvent);

jest.mock('../sdk', () => ({
  useRampSDK: () => ({
    selectedPaymentMethodId: 'pm',
    selectedRegion: { id: '/regions/us' },
    selectedAsset: { symbol: 'ETH' },
    selectedFiatCurrencyId: 'usd',
    isBuy: true,
  }),
}));

describe('ErrorView', () => {
  beforeEach(() => {
    mockTrackEvent.mockClear();
  });

  it('renders the default error UI and tracks an ONRAMP_ERROR event', () => {
    const { toJSON, getByText } = renderWithProvider(
      <ErrorView description="Something broke" location="Amount to Buy Screen" />,
    );
    expect(getByText('Something broke')).toBeDefined();
    expect(mockTrackEvent).toHaveBeenCalledWith(
      'ONRAMP_ERROR',
      expect.objectContaining({
        location: 'Amount to Buy Screen',
        message: 'Something broke',
      }),
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders title, custom cta label, and invokes the cta callback when pressed', () => {
    const ctaOnPress = jest.fn();
    const { getByText } = renderWithProvider(
      <ErrorView
        title="Oops"
        description="Broken"
        ctaLabel="Retry"
        ctaOnPress={ctaOnPress}
        icon="info"
        location="Quotes Screen"
      />,
    );
    expect(getByText('Oops')).toBeDefined();
    fireEvent.press(getByText('Retry'));
    expect(ctaOnPress).toHaveBeenCalledTimes(1);
  });

  it('renders the expired icon when requested', () => {
    const { toJSON } = renderWithProvider(
      <ErrorView
        description="Expired"
        location="Quotes Screen"
        icon="expired"
      />,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
