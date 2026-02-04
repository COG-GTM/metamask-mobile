import React, { useCallback, useEffect, useState } from 'react';
import { View, GestureResponderEvent, LayoutChangeEvent } from 'react-native';
import { useSelector } from 'react-redux';
import { Defs, Line, LinearGradient, Stop } from 'react-native-svg';
import { BarChart, Grid } from 'react-native-svg-charts';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';

import { strings } from '../../../../../../locales/i18n';
import { useStyles } from '../../../../../component-library/hooks';
import { useTheme } from '../../../../../util/theme';
import Text, {
  TextVariant,
  TextColor,
} from '../../../../../component-library/components/Texts/Text';
import SensitiveText, {
  SensitiveTextLength,
} from '../../../../../component-library/components/Texts/SensitiveText';
import Icon, {
  IconColor,
  IconName,
  IconSize,
} from '../../../../../component-library/components/Icons/Icon';
import ChartNavigationButton from '../../../AssetOverview/ChartNavigationButton/ChartNavigationButton';
import { selectPrivacyMode } from '../../../../../selectors/preferencesController';

import styleSheet, { CHART_HEIGHT } from './GasFeeAnalyticsChart.styles';
import {
  GasFeeAnalyticsChartProps,
  GasFeeDataPoint,
  GasTimePeriod,
} from './GasFeeAnalyticsChart.types';

const GAS_TIME_PERIODS: GasTimePeriod[] = ['7d', '1m', '3m', '1y'];

interface HorizontalLinesProps {
  x?: (index: number) => number;
  y?: (value: number) => number;
  height?: number;
  bandwidth?: number;
  data?: { value: number; label: string; svg: { fill: string } }[];
  onBandWidthChange?: (width: number) => void;
  strokeColor: string;
}

const HorizontalLines = ({
  x,
  y,
  height,
  bandwidth: bandWidth,
  data,
  onBandWidthChange,
  strokeColor,
}: HorizontalLinesProps) => {
  useEffect(() => {
    onBandWidthChange?.(bandWidth ?? 0);
  }, [bandWidth, onBandWidthChange]);

  const renderBarTopLines = useCallback(() => {
    if (!x || !y || !height || !data || !bandWidth) return null;

    return data.map((item, index) => (
      <Line
        key={`gas-chart-line-${index}`}
        x1={x(index)}
        x2={x(index) + bandWidth}
        y1={y(item.value) - 0.5}
        y2={y(item.value) - 0.5}
        stroke={strokeColor}
        strokeWidth={1}
      />
    ));
  }, [data, x, y, height, bandWidth, strokeColor]);

  return <>{renderBarTopLines()}</>;
};

const GasFeeAnalyticsChart = ({
  data,
  isLoading = false,
  totalGasFees,
  currency = 'USD',
  onTimePeriodChange,
  selectedTimePeriod = '1m',
}: GasFeeAnalyticsChartProps) => {
  const privacyMode = useSelector(selectPrivacyMode);
  const { colors } = useTheme();
  const { styles } = useStyles(styleSheet, {});

  const barGradientId = 'gas-bar-gradient';

  const [selectedBarIndex, setSelectedBarIndex] = useState<number>(-1);
  const [selectedBarAmount, setSelectedBarAmount] = useState<string | null>(null);
  const [selectedBarLabel, setSelectedBarLabel] = useState<string | null>(null);
  const [bandWidth, setBandWidth] = useState<number>(0);
  const [chartWidth, setChartWidth] = useState<number>(0);
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number>(-1);
  const [transformedData, setTransformedData] = useState<
    { value: number; label: string; svg: { fill: string } }[]
  >([]);

  useEffect(() => {
    if (data && data.length > 0) {
      const newTransformedData = data.map((item: GasFeeDataPoint, index: number) => ({
        value: item.value,
        label: item.label,
        svg: {
          fill:
            index === selectedBarIndex
              ? colors.warning.default
              : `url(#${barGradientId})`,
        },
      }));
      setTransformedData(newTransformedData);
    }
  }, [data, selectedBarIndex, colors.warning.default]);

  useEffect(() => {
    setSelectedBarIndex(-1);
    setSelectedBarAmount(null);
    setSelectedBarLabel(null);
  }, [data]);

  useEffect(() => {
    if (hoveredBarIndex !== -1) {
      setSelectedBarIndex(hoveredBarIndex);
    }
  }, [hoveredBarIndex]);

  useEffect(() => {
    if (selectedBarIndex !== -1 && selectedBarIndex < data.length) {
      setSelectedBarAmount(data[selectedBarIndex].value.toFixed(2));
      setSelectedBarLabel(data[selectedBarIndex].label);
    } else {
      setSelectedBarAmount(null);
      setSelectedBarLabel(null);
    }
  }, [selectedBarIndex, data]);

  const updateBarHoveredBarIndex = useCallback(
    (xHover: number) => {
      if (!bandWidth || !chartWidth || !data.length) return;
      const barWidthTotal = bandWidth * data.length;
      const spacingTotal = chartWidth - barWidthTotal;
      const estimateGapSize = spacingTotal
        ? spacingTotal / (data.length - 1)
        : 0;
      const barSegment = Math.floor(xHover / (bandWidth + estimateGapSize));
      if (barSegment >= 0 && barSegment < data.length) {
        setHoveredBarIndex(barSegment);
      } else {
        setHoveredBarIndex(-1);
      }
    },
    [bandWidth, chartWidth, data.length],
  );

  const handleTouch = (evt: GestureResponderEvent) => {
    updateBarHoveredBarIndex(evt.nativeEvent.locationX);
  };

  const handleTouchEnd = () => {
    setHoveredBarIndex(-1);
  };

  const handleTimePeriodPress = (period: GasTimePeriod) => {
    onTimePeriodChange?.(period);
  };

  const displayAmount = selectedBarAmount ?? totalGasFees;
  const displayLabel = selectedBarLabel ?? strings('portfolio_analytics.total_gas_fees');

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <SkeletonPlaceholder>
            <SkeletonPlaceholder.Item
              width={300}
              height={CHART_HEIGHT}
              borderRadius={6}
            />
          </SkeletonPlaceholder>
        </View>
      </View>
    );
  }

  if (!data || data.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.noDataContainer}>
          <Icon
            name={IconName.Warning}
            color={IconColor.Muted}
            size={IconSize.Xl}
          />
          <Text variant={TextVariant.BodyMD} color={TextColor.Alternative}>
            {strings('portfolio_analytics.no_gas_data')}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.totalContainer}>
            <SensitiveText
              isHidden={privacyMode}
              length={SensitiveTextLength.Long}
              variant={TextVariant.HeadingLG}
              style={{ color: colors.warning.default }}
            >
              {displayAmount ? `$${displayAmount}` : '--'} {currency}
            </SensitiveText>
            <Text variant={TextVariant.BodyMD} color={TextColor.Alternative}>
              {displayLabel}
            </Text>
          </View>
        </View>
      </View>

      <View
        style={styles.chartContainer}
        onLayout={(event: LayoutChangeEvent) => {
          const { width } = event.nativeEvent.layout;
          setChartWidth(width);
        }}
        onTouchStart={handleTouch}
        onTouchMove={handleTouch}
        onTouchEnd={handleTouchEnd}
      >
        <BarChart
          style={styles.chart}
          data={transformedData}
          gridMin={0}
          contentInset={{ top: 1, bottom: 0 }}
          yAccessor={({ item }) => item.value}
          spacingInner={0.1}
          spacingOuter={0}
        >
          <Grid svg={{ stroke: 'transparent' }} />
          <Defs>
            <LinearGradient
              id={barGradientId}
              x1="0%"
              y1="100%"
              x2="0%"
              y2="0%"
            >
              <Stop
                offset="0%"
                stopColor={colors.warning.muted}
                stopOpacity={0}
              />
              <Stop
                offset="100%"
                stopColor={colors.warning.muted}
                stopOpacity={0.3}
              />
            </LinearGradient>
          </Defs>
          <HorizontalLines
            onBandWidthChange={setBandWidth}
            strokeColor={colors.warning.default}
          />
        </BarChart>
      </View>

      <View style={styles.timePeriodContainer}>
        {GAS_TIME_PERIODS.map((period) => (
          <ChartNavigationButton
            key={period}
            label={strings(`asset_overview.chart_time_period_navigation.${period}`)}
            selected={selectedTimePeriod === period}
            onPress={() => handleTimePeriodPress(period)}
          />
        ))}
      </View>
    </View>
  );
};

export default GasFeeAnalyticsChart;
