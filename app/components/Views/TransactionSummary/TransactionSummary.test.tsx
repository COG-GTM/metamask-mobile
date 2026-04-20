import React from 'react';
import { render } from '@testing-library/react-native';
import TransactionSummary from './index';
import { ThemeContext, mockTheme } from '../../../util/theme';

jest.mock('../../../util/networks', () => ({
  ...jest.requireActual('../../../util/networks'),
  isTestNet: jest.fn(() => false),
}));

const renderWithTheme = (component: React.ReactElement) =>
  render(
    <ThemeContext.Provider value={mockTheme}>
      {component}
    </ThemeContext.Provider>,
  );

describe('TransactionSummary', () => {
  it('renders correctly for sent transaction', () => {
    const { toJSON } = renderWithTheme(
      <TransactionSummary
        amount="0.5 ETH"
        fee="0.001 ETH"
        totalAmount="0.501 ETH"
        secondaryTotalAmount="$500.00"
        gasEstimationReady
        transactionType="transaction_sent"
        chainId="0x1"
      />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders correctly for received transaction', () => {
    const { toJSON } = renderWithTheme(
      <TransactionSummary
        amount="1.0 ETH"
        fee="0.002 ETH"
        totalAmount="1.002 ETH"
        secondaryTotalAmount="$1000.00"
        gasEstimationReady
        transactionType="transaction_received"
        chainId="0x1"
      />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it('shows loader when gas estimation is not ready', () => {
    const { toJSON } = renderWithTheme(
      <TransactionSummary
        amount="0.5 ETH"
        fee="0.001 ETH"
        totalAmount="0.501 ETH"
        gasEstimationReady={false}
        transactionType="transaction_sent"
        chainId="0x1"
      />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders token_id title for collectible transactions', () => {
    const { getByText } = renderWithTheme(
      <TransactionSummary
        amount="#1234"
        fee="0.001 ETH"
        totalAmount="0.001 ETH"
        gasEstimationReady
        transactionType="transaction_sent_collectible"
        chainId="0x1"
      />,
    );
    expect(getByText('Token ID')).toBeDefined();
  });
});
