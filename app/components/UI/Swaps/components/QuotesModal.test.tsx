import React from 'react';
import { StyleSheet } from 'react-native';
import { fireEvent, screen } from '@testing-library/react-native';
import { ReactTestInstance } from 'react-test-renderer';

import QuotesModal from './QuotesModal';
import renderWithProvider, {
  DeepPartial,
} from '../../../../util/test/renderWithProvider';
import { backgroundState } from '../../../../util/test/initial-root-state';
import { RootState } from '../../../../reducers';
import { mockTheme } from '../../../../util/theme';
import { strings } from '../../../../../locales/i18n';
import { fontStyles } from '../../../../styles/common';

jest.mock('react-native-modal', () => {
  const { createElement } = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  return ({
    isVisible,
    children,
  }: {
    isVisible: boolean;
    children: React.ReactNode;
  }) => (isVisible ? createElement(View, null, children) : null);
});

const DECIMALS = 18;
const toMinimalUnit = (amount: string) => `${amount}${'0'.repeat(DECIMALS)}`;

const mockQuotes = [
  {
    aggregator: 'bestAgg',
    aggType: 'DEX',
    destinationAmount: toMinimalUnit('100'),
    sourceAmount: toMinimalUnit('1'),
    slippage: 2,
  },
  {
    aggregator: 'midAgg',
    aggType: 'RFQ',
    destinationAmount: '98500000000000000000',
    sourceAmount: toMinimalUnit('1'),
    slippage: 3,
  },
  {
    aggregator: 'worstAgg',
    aggType: 'DEX',
    destinationAmount: toMinimalUnit('95'),
    sourceAmount: toMinimalUnit('1'),
    slippage: 4,
  },
];

// conversionRate = 2000 USD/ETH
// overall value deltas vs best (0.05 ETH): 0, 0.001 ETH ($2.00), 0.01 ETH ($20.00)
// eth fees: 0.0015 ETH ($3.00), 0.0025 ETH ($5.00), 0.0035 ETH ($7.00)
const mockQuoteValues = {
  bestAgg: { overallValueOfQuote: '0.05', ethFee: '0.0015' },
  midAgg: { overallValueOfQuote: '0.049', ethFee: '0.0025' },
  worstAgg: { overallValueOfQuote: '0.04', ethFee: '0.0035' },
};

const buildState = (
  quoteValues: Record<string, unknown> = mockQuoteValues,
): DeepPartial<RootState> => ({
  engine: {
    backgroundState: {
      ...backgroundState,
      CurrencyRateController: {
        currentCurrency: 'usd',
        currencyRates: {
          ETH: {
            conversionDate: 0,
            conversionRate: 2000,
            usdConversionRate: 2000,
          },
        },
      },
      SwapsController: {
        ...backgroundState.SwapsController,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        quoteValues: quoteValues as any,
      },
    },
  },
});

const sourceToken = { symbol: 'ETH', decimals: 18 };
const destinationToken = { symbol: 'DAI', decimals: DECIMALS };

const renderQuotesModal = ({
  showOverallValue = true,
  selectedQuote = 'midAgg',
  quoteValues,
  quotes = mockQuotes,
  toggleModal = jest.fn(),
}: {
  showOverallValue?: boolean;
  selectedQuote?: string;
  quoteValues?: Record<string, unknown>;
  quotes?: typeof mockQuotes;
  toggleModal?: jest.Mock;
} = {}) =>
  renderWithProvider(
    <QuotesModal
      isVisible
      toggleModal={toggleModal}
      quotes={quotes}
      selectedQuote={selectedQuote}
      sourceToken={sourceToken}
      destinationToken={destinationToken}
      showOverallValue={showOverallValue}
      ticker="ETH"
    />,
    { state: buildState(quoteValues) },
  );

const findQuoteRow = (amountText: string): ReactTestInstance => {
  let node: ReactTestInstance | null = screen.getByText(amountText);
  while (node) {
    const style = StyleSheet.flatten(node.props.style) ?? {};
    if (style.borderTopWidth === 1) {
      return node;
    }
    node = node.parent;
  }
  throw new Error(`Quote row for "${amountText}" not found`);
};

describe('QuotesModal', () => {
  it('lists every quote with its receiving amount and fiat gas fee', () => {
    renderQuotesModal();

    expect(screen.getByText(strings('swaps.quotes_overview'))).toBeTruthy();
    expect(screen.getByText('~100')).toBeTruthy();
    expect(screen.getByText('~98.5')).toBeTruthy();
    expect(screen.getByText('~95')).toBeTruthy();
    expect(screen.getByText('$3.00')).toBeTruthy();
    expect(screen.getByText('$5.00')).toBeTruthy();
    expect(screen.getByText('$7.00')).toBeTruthy();
  });

  describe('when showOverallValue is true', () => {
    it('shows each quote shortfall versus the best overall value in fiat', () => {
      renderQuotesModal({ showOverallValue: true });

      const bestRow = findQuoteRow('~100');
      const midRow = findQuoteRow('~98.5');
      const worstRow = findQuoteRow('~95');

      expect(bestRow).toContainElement(screen.getByText('-$0.00'));
      expect(midRow).toContainElement(screen.getByText('-$2.00'));
      expect(worstRow).toContainElement(screen.getByText('-$20.00'));
      expect(screen.queryByText('-1.5')).toBeNull();
      expect(screen.queryByText('-5')).toBeNull();
    });

    it('treats a quote without overallValueOfQuote as having zero overall value', () => {
      renderQuotesModal({
        showOverallValue: true,
        quoteValues: {
          ...mockQuoteValues,
          midAgg: { ethFee: mockQuoteValues.midAgg.ethFee },
        },
      });

      // 0.05 ETH best overall value - 0 = 0.05 ETH * 2000 = $100.00
      expect(findQuoteRow('~98.5')).toContainElement(
        screen.getByText('-$100.00'),
      );
    });
  });

  describe('when showOverallValue is false', () => {
    it('shows each quote shortfall versus the first quote destination amount', () => {
      renderQuotesModal({ showOverallValue: false });

      expect(findQuoteRow('~100')).toContainElement(screen.getByText('-0'));
      expect(findQuoteRow('~98.5')).toContainElement(screen.getByText('-1.5'));
      expect(findQuoteRow('~95')).toContainElement(screen.getByText('-5'));
      expect(screen.queryByText('-$2.00')).toBeNull();
      expect(screen.queryByText('-$20.00')).toBeNull();
    });
  });

  it('highlights only the selected quote row', () => {
    renderQuotesModal({ selectedQuote: 'midAgg' });

    const selectedBackground = mockTheme.colors.primary.muted;
    const backgroundOf = (amountText: string) =>
      StyleSheet.flatten(findQuoteRow(amountText).props.style).backgroundColor;

    expect(backgroundOf('~98.5')).toBe(selectedBackground);
    expect(backgroundOf('~100')).not.toBe(selectedBackground);
    expect(backgroundOf('~95')).not.toBe(selectedBackground);
    const fontWeightOf = (amountText: string) =>
      StyleSheet.flatten(screen.getByText(amountText).props.style).fontWeight;
    expect(fontWeightOf('~98.5')).toBe(fontStyles.bold.fontWeight);
    expect(fontWeightOf('~100')).toBe(fontStyles.normal.fontWeight);
    expect(fontWeightOf('~95')).toBe(fontStyles.normal.fontWeight);
  });

  it('opens the pressed quote details and navigates back to the list', () => {
    renderQuotesModal();

    fireEvent.press(findQuoteRow('~95'));

    expect(screen.getByText(strings('swaps.quote_details'))).toBeTruthy();
    expect(screen.queryByText(strings('swaps.quotes_overview'))).toBeNull();
    expect(screen.getByText('4%')).toBeTruthy();
    expect(screen.getByText('(~$7.00)')).toBeTruthy();
    expect(screen.queryByText('~100')).toBeNull();

    fireEvent.press(screen.getByText(strings('swaps.quote_details')));

    expect(screen.getByText(strings('swaps.quotes_overview'))).toBeTruthy();
    expect(screen.getByText('~95')).toBeTruthy();
  });
});
