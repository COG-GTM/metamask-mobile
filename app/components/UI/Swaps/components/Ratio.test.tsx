import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import Ratio from './Ratio';

describe('Ratio', () => {
  const defaultProps = {
    sourceAmount: '1000000000000000000', // 1 ETH
    sourceToken: { symbol: 'ETH', decimals: 18 },
    destinationAmount: '2000000', // 2 USDC
    destinationToken: { symbol: 'USDC', decimals: 6 },
  };

  it('matches snapshot', () => {
    const { toJSON } = render(<Ratio {...defaultProps} />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders the ratio with the source symbol as denominator by default', () => {
    const { getByText } = render(<Ratio {...defaultProps} />);
    expect(getByText('ETH')).toBeTruthy();
    expect(getByText('USDC')).toBeTruthy();
  });

  it('toggles the ratio direction when pressed', () => {
    const { getByText, queryByText, toJSON } = render(
      <Ratio {...defaultProps} />,
    );
    const before = JSON.stringify(toJSON());
    fireEvent.press(getByText('ETH'));
    const after = JSON.stringify(toJSON());
    expect(before).not.toEqual(after);
    expect(queryByText('ETH')).toBeTruthy();
    expect(queryByText('USDC')).toBeTruthy();
  });

  it('supports boldSymbol prop', () => {
    const { toJSON } = render(<Ratio {...defaultProps} boldSymbol />);
    expect(toJSON()).toBeTruthy();
  });
});
