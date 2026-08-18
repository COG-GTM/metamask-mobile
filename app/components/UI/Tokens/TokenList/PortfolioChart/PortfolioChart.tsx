import React, { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useSelector } from 'react-redux';
import { strings } from '../../../../../../locales/i18n';
import { useStyles } from '../../../../../component-library/hooks';
import Text, {
  TextColor,
  TextVariant,
} from '../../../../../component-library/components/Texts/Text';
import { selectCurrentCurrency } from '../../../../../selectors/currencyRateController';
import { selectIsEvmNetworkSelected } from '../../../../../selectors/multichainNetworkController';
import { toDateFormat } from '../../../../../util/date';
import { addCurrencySymbol } from '../../../../../util/number';
import { usePortfolioBalanceHistory } from '../../../../hooks/usePortfolioBalanceHistory';
import { TimePeriod } from '../../../../hooks/useTokenHistoricalPrices';
import ChartNavigationButton from '../../../AssetOverview/ChartNavigationButton';
import PriceChart from '../../../AssetOverview/PriceChart';
import { PriceChartProvider } from '../../../AssetOverview/PriceChart/PriceChart.context';
import { distributeDataPoints } from '../../../AssetOverview/PriceChart/utils';
import styleSheet, { PORTFOLIO_CHART_HEIGHT } from './PortfolioChart.styles';
import {
  PORTFOLIO_CHART_TEST_ID,
  PORTFOLIO_CHART_DIFF_TEST_ID,
} from './PortfolioChart.constants';

const TIME_PERIODS: TimePeriod[] = ['1d', '1w', '1m', '3m', '1y'];

/**
 * Historical fiat value of the account's holdings, rendered under the total
 * balance on the wallet home screen.
 */
const PortfolioChart = () => {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('1d');
  const [activeIndex, setActiveIndex] = useState(-1);

  const currentCurrency = useSelector(selectCurrentCurrency);
  const isEvmSelected = useSelector(selectIsEvmNetworkSelected);

  const { data, isLoading } = usePortfolioBalanceHistory({ timePeriod });

  const series = useMemo(
    () => (data.length > 0 ? distributeDataPoints(data) : []),
    [data],
  );

  const startValue = series[0]?.[1] ?? 0;
  const activePoint = series[activeIndex];
  const endValue = activePoint?.[1] ?? series[series.length - 1]?.[1] ?? 0;
  const diff = series.length > 0 ? endValue - startValue : 0;
  const percentDiff = startValue > 0 ? (diff / startValue) * 100 : 0;

  const { styles } = useStyles(styleSheet, { diff });

  const handleSelectTimePeriod = useCallback((period: TimePeriod) => {
    setActiveIndex(-1);
    setTimePeriod(period);
  }, []);

  if (!isEvmSelected || (!isLoading && series.length === 0)) {
    return null;
  }

  const label = activePoint
    ? toDateFormat(Number(activePoint[0]))
    : strings(`asset_overview.chart_time_period.${timePeriod}`);

  return (
    <PriceChartProvider>
      <View style={styles.wrapper} testID={PORTFOLIO_CHART_TEST_ID}>
        {!isLoading && (
          <View style={styles.summary}>
            <Text
              variant={TextVariant.BodyMDMedium}
              style={styles.diff}
              testID={PORTFOLIO_CHART_DIFF_TEST_ID}
            >
              <Icon
                name={
                  diff > 0
                    ? 'trending-up'
                    : diff < 0
                    ? 'trending-down'
                    : 'minus'
                }
                size={16}
              />{' '}
              {addCurrencySymbol(diff, currentCurrency, true)} (
              {diff > 0 ? '+' : ''}
              {percentDiff.toFixed(2)}%)
            </Text>
            <Text
              variant={TextVariant.BodyMDMedium}
              color={TextColor.Alternative}
            >
              {label}
            </Text>
          </View>
        )}
        <PriceChart
          prices={series}
          priceDiff={diff}
          isLoading={isLoading}
          onChartIndexChange={setActiveIndex}
          height={PORTFOLIO_CHART_HEIGHT}
        />
        <View style={styles.timePeriods}>
          {TIME_PERIODS.map((period) => (
            <ChartNavigationButton
              key={period}
              label={strings(
                `asset_overview.chart_time_period_navigation.${period}`,
              )}
              onPress={() => handleSelectTimePeriod(period)}
              selected={timePeriod === period}
            />
          ))}
        </View>
      </View>
    </PriceChartProvider>
  );
};

export default PortfolioChart;
