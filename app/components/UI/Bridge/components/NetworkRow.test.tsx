import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { NetworkRow } from './NetworkRow';

describe('NetworkRow', () => {
  it('matches snapshot with the chain name visible', () => {
    const { toJSON, getByText } = render(
      <NetworkRow chainId="0x1" chainName="Ethereum Mainnet" />,
    );
    expect(getByText('Ethereum Mainnet')).toBeTruthy();
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders children when provided', () => {
    const { getByText } = render(
      <NetworkRow chainId="0x1" chainName="Ethereum">
        <Text>right-side</Text>
      </NetworkRow>,
    );
    expect(getByText('right-side')).toBeTruthy();
  });

  it('omits the children wrapper when no children are provided', () => {
    const { queryByText } = render(
      <NetworkRow chainId="0x1" chainName="Ethereum" />,
    );
    expect(queryByText('right-side')).toBeNull();
  });
});
