import React from 'react';
import { render } from '@testing-library/react-native';
import PriceChart from './PriceChart';
import { PriceChartProvider } from './PriceChart.context';

interface PanConfigLike {
  onPanResponderGrant: (evt: { nativeEvent: { locationX: number; locationY: number } }) => void;
  onPanResponderMove: (evt: { nativeEvent: { locationX: number; locationY: number } }) => void;
  onPanResponderRelease: () => void;
  onStartShouldSetPanResponder: () => boolean;
  onMoveShouldSetPanResponder: () => boolean;
}

let lastPanConfig: PanConfigLike | undefined;

jest.mock('react-native/Libraries/Interaction/PanResponder', () => ({
  __esModule: true,
  default: {
    create: (config: PanConfigLike) => {
      lastPanConfig = config;
      return { panHandlers: {} };
    },
  },
  create: (config: PanConfigLike) => {
    lastPanConfig = config;
    return { panHandlers: {} };
  },
}));

const pricePoints = Array.from({ length: 30 }, (_, i) => [
  String(i),
  10 + i,
]) as [string, number][];

const renderChart = (props: Partial<React.ComponentProps<typeof PriceChart>> = {}) =>
  render(
    <PriceChartProvider>
      <PriceChart
        prices={pricePoints}
        priceDiff={1}
        isLoading={false}
        onChartIndexChange={jest.fn()}
        {...props}
      />
    </PriceChartProvider>,
  );

describe('PriceChart', () => {
  it('renders a skeleton while loading and matches snapshot', () => {
    const { toJSON } = renderChart({ isLoading: true });

    expect(toJSON()).toMatchSnapshot();
  });

  it('renders the chart when price data is provided', () => {
    const { toJSON } = renderChart();

    expect(toJSON()).toMatchSnapshot();
  });

  it('renders the no-data overlay when the price list is empty', () => {
    const { getByText } = renderChart({ prices: [], priceDiff: 0 });

    expect(getByText(/no chart data/i)).toBeDefined();
  });

  it('renders the chart with a negative price diff', () => {
    const { toJSON } = renderChart({ priceDiff: -5 });

    expect(toJSON()).toBeTruthy();
  });

  it('renders the chart with a zero price diff', () => {
    const { toJSON } = renderChart({ priceDiff: 0 });

    expect(toJSON()).toBeTruthy();
  });

  it('wires up the pan responder and updates the active index on touch', () => {
    const onChartIndexChange = jest.fn();
    renderChart({ onChartIndexChange });

    const cfg = lastPanConfig;
    expect(cfg).toBeDefined();
    if (!cfg) return;

    expect(cfg.onStartShouldSetPanResponder()).toBe(true);
    expect(cfg.onMoveShouldSetPanResponder()).toBe(true);

    cfg.onPanResponderGrant({
      nativeEvent: { locationX: 100, locationY: 10 },
    });
    cfg.onPanResponderMove({
      nativeEvent: { locationX: 150, locationY: 12 },
    });
    cfg.onPanResponderMove({
      nativeEvent: { locationX: 150, locationY: 200 },
    });
    cfg.onPanResponderRelease();

    expect(onChartIndexChange).toHaveBeenCalled();
    expect(onChartIndexChange).toHaveBeenLastCalledWith(-1);
  });

  it('clamps touch positions outside the chart bounds', () => {
    const onChartIndexChange = jest.fn();
    renderChart({ onChartIndexChange });

    const cfg = lastPanConfig;
    expect(cfg).toBeDefined();
    if (!cfg) return;

    cfg.onPanResponderGrant({
      nativeEvent: { locationX: -50, locationY: 0 },
    });
    cfg.onPanResponderGrant({
      nativeEvent: { locationX: 99999, locationY: 0 },
    });

    expect(onChartIndexChange).toHaveBeenCalled();
  });
});
