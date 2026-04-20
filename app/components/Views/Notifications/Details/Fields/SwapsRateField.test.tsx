import React from 'react';
import { render } from '@testing-library/react-native';
import SwapsRateField from './SwapsRateField';
import { ModalFieldType } from '../../../../../util/notifications';

describe('SwapsRateField', () => {
  const baseProps = {
    type: ModalFieldType.SWAP_RATE as const,
    rate: '1 ETH = 2000 USDC',
  };

  it('renders correctly', () => {
    const { toJSON } = render(<SwapsRateField {...baseProps} />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders the rate string passed via props', () => {
    const { getByText } = render(<SwapsRateField {...baseProps} />);
    expect(getByText('1 ETH = 2000 USDC')).toBeDefined();
  });

  it('renders updated rate when props change', () => {
    const { getByText } = render(
      <SwapsRateField {...baseProps} rate="1 BTC = 20 ETH" />,
    );
    expect(getByText('1 BTC = 20 ETH')).toBeDefined();
  });
});
