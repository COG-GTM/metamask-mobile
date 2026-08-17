import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import renderWithProvider from '../../../../../util/test/renderWithProvider';
import { backgroundState } from '../../../../../util/test/initial-root-state';
import { TokenPrice } from '../../../../hooks/useTokenHistoricalPrices';
import PortfolioChart from './PortfolioChart';
import {
  PORTFOLIO_CHART_DIFF_TEST_ID,
  PORTFOLIO_CHART_TEST_ID,
} from './PortfolioChart.constants';

const mockUsePortfolioBalanceHistory = jest.fn();

jest.mock('../../../../hooks/usePortfolioBalanceHistory', () => ({
  usePortfolioBalanceHistory: (args: { timePeriod: string }) =>
    mockUsePortfolioBalanceHistory(args),
}));

const series: TokenPrice[] = [
  ['1700000000000', 100],
  ['1700003600000', 110],
  ['1700007200000', 125],
];

const initialState = {
  engine: { backgroundState },
};

const render = () =>
  renderWithProvider(<PortfolioChart />, { state: initialState });

describe('PortfolioChart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePortfolioBalanceHistory.mockReturnValue({
      data: series,
      isLoading: false,
      error: undefined,
    });
  });

  it('renders the change over the selected period', () => {
    const { getByTestId } = render();

    expect(getByTestId(PORTFOLIO_CHART_TEST_ID)).toBeTruthy();
    expect(getByTestId(PORTFOLIO_CHART_DIFF_TEST_ID)).toHaveTextContent(
      /\$25\.00 \(\+25\.00%\)/,
    );
  });

  it('requests the selected time period', () => {
    const { getByText } = render();

    expect(mockUsePortfolioBalanceHistory).toHaveBeenLastCalledWith({
      timePeriod: '1d',
    });

    fireEvent.press(getByText('1M'));

    expect(mockUsePortfolioBalanceHistory).toHaveBeenLastCalledWith({
      timePeriod: '1m',
    });
  });

  it('renders nothing when the account has no history', () => {
    mockUsePortfolioBalanceHistory.mockReturnValue({
      data: [],
      isLoading: false,
      error: undefined,
    });

    const { queryByTestId } = render();

    expect(queryByTestId(PORTFOLIO_CHART_TEST_ID)).toBeNull();
  });

  it('renders the chart without a summary while loading', () => {
    mockUsePortfolioBalanceHistory.mockReturnValue({
      data: [],
      isLoading: true,
      error: undefined,
    });

    const { getByTestId, queryByTestId } = render();

    expect(getByTestId(PORTFOLIO_CHART_TEST_ID)).toBeTruthy();
    expect(queryByTestId(PORTFOLIO_CHART_DIFF_TEST_ID)).toBeNull();
  });
});
