import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import renderWithProvider from '../../../../util/test/renderWithProvider';

jest.mock('react-native-modal', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ({ children, isVisible }: any) =>
    isVisible ? <View>{children}</View> : null;
});

jest.mock('../../Swaps/components/TokenIcon', () => () => null);

// eslint-disable-next-line import/first
import TokenSelectModal from './TokenSelectModal';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tokens: any[] = [
  {
    id: 't-1',
    symbol: 'ETH',
    name: 'Ethereum',
    address: '0x0000000000000000000000000000000000000000',
    logo: 'eth.png',
    network: { shortName: 'Ethereum' },
  },
  {
    id: 't-2',
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    logo: 'usdc.png',
    network: { shortName: 'Ethereum' },
  },
];

describe('TokenSelectModal', () => {
  it('renders the token list excluding blacklisted addresses', () => {
    const { getByText, queryByText, toJSON } = renderWithProvider(
      <TokenSelectModal
        isVisible
        dismiss={jest.fn()}
        tokens={tokens}
        onItemPress={jest.fn()}
        excludeAddresses={['0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48']}
      />,
    );
    expect(getByText('ETH')).toBeDefined();
    expect(queryByText('USDC')).toBeNull();
    expect(toJSON()).toMatchSnapshot();
  });

  it('does not render tokens when hidden', () => {
    const { queryByText } = renderWithProvider(
      <TokenSelectModal
        isVisible={false}
        dismiss={jest.fn()}
        tokens={tokens}
        onItemPress={jest.fn()}
      />,
    );
    expect(queryByText('ETH')).toBeNull();
  });

  it('invokes onItemPress with the tapped token', () => {
    const onItemPress = jest.fn();
    const { getByText } = renderWithProvider(
      <TokenSelectModal
        isVisible
        dismiss={jest.fn()}
        tokens={tokens}
        onItemPress={onItemPress}
      />,
    );
    fireEvent.press(getByText('USDC'));
    expect(onItemPress).toHaveBeenCalledWith(
      expect.objectContaining({ symbol: 'USDC' }),
    );
  });
});
