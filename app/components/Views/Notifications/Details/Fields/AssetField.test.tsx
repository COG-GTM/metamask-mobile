import React from 'react';
import AssetField from './AssetField';
import { ModalFieldType } from '../../../../../util/notifications';
import renderWithProvider from '../../../../../util/test/renderWithProvider';
import { backgroundState } from '../../../../../util/test/initial-root-state';

const mockInitialState = {
  engine: {
    backgroundState,
  },
};

describe('AssetField', () => {
  const baseProps = {
    type: ModalFieldType.ASSET as const,
    tokenIconUrl: 'https://example.com/token.png',
    tokenNetworkUrl: 'https://example.com/network.png',
    label: 'Received',
    description: 'USDC',
    amount: '100 USDC',
    usdAmount: '$100.54',
  };

  it('renders correctly', () => {
    const { toJSON } = renderWithProvider(<AssetField {...baseProps} />, {
      state: mockInitialState,
    });
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders label, description, amount and usdAmount', () => {
    const { getByText } = renderWithProvider(<AssetField {...baseProps} />, {
      state: mockInitialState,
    });
    expect(getByText('Received')).toBeDefined();
    expect(getByText('USDC')).toBeDefined();
    expect(getByText('100 USDC')).toBeDefined();
    expect(getByText('$100.54')).toBeDefined();
  });

  it('accepts ImageSourcePropType values for tokenIconUrl and tokenNetworkUrl', () => {
    const { toJSON } = renderWithProvider(
      <AssetField
        {...baseProps}
        tokenIconUrl={{ uri: 'https://example.com/t.png' }}
        tokenNetworkUrl={{ uri: 'https://example.com/n.png' }}
      />,
      { state: mockInitialState },
    );
    expect(toJSON()).toBeTruthy();
  });
});
