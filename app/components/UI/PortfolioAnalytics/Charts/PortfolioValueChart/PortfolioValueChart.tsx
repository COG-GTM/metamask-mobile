import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  GestureResponderEvent,
  PanResponder,
  View,
} from 'react-native';
import { useSelector } from 'react-redux';
import {
  Circle,
  Defs,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Line as SvgLine,
} from 'react-native-svg';
import { AreaChart } from 'react-native-svg-charts';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';

import { strings } from '../../../../../../locales/i18n';
import { useStyles } from '../../../../../component-library/hooks';
import Text, {
  TextVariant,
} from '../../../../../component-library/components/Texts/Text';
import SensitiveText, {
  SensitiveTextLength,
} from '../../../../../component-library/components/Texts/SensitiveText';
import Icon, {
  IconColor,
  IconName,
  IconSize,
} from '../../../../../component-library/components/Icons/Icon';
import Title from '../../../../Base/Title';
import ChartNavigationButton from '../../../AssetOverview/ChartNavigationButton/ChartNavigationButton';
import { selectPrivacyMode } from '../../../../../selectors/preferencesController';

import styleSheet, { CHART_HEIGHT } from './PortfolioValueChart.styles';
import {
  PortfolioValueChartProps,
  PortfolioDataPoint,
  TimePeriod,
} from './PortfolioValueChart.types';

const TIME_PERIODS: TimePeriod[] = ['1d', '7d', '1m', '3m', '1y'];

const placeholderData = Array.from({ length: 30 }, (_, i) =>
  Math.sin(i / 5) * 50 + 100,
);

interface LineProps {
  line: string;
  chartHasData: boolean;
}

interface TooltipProps {
  x: (index: number) => number;
  y: (value: number) => number;
}

const PortfolioValueChart = ({
  data,
  isLoading = false,
  onTimePeriodChange,
  selectedTimePeriod = '1m',
  currentValue,
  valueChange,
  valueChangePercentage,
}: PortfolioValueChartProps) => {
  const privacyMode = useSelector(selectPrivacyMode);
  const [positionX, setPositionX] = useState(-1);
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const { styles, theme } = useStyles(styleSheet, {});

  useEffect(() => {
    setPositionX(-1);
    setSelectedValue(null);
  }, [data]);

  const chartColor =
    valueChange !== undefined && valueChange >= 0
      ? theme.colors.success.default
      : theme.colors.error.default;

  const apx = (size = 0) => {
    const width = Dimensions.get('window').width;
    return (width / 750) * size;
  };

  const priceList = data.map((point: PortfolioDataPoint) => point.value);

  const onActiveIndexChange = (index: number) => {
    setPositionX(index);
    if (index >= 0 && index < data.length) {
      setSelectedValue(data[index].value.toFixed(2));
    } else {
      setSelectedValue(null);
    }
  };

  const updatePosition = (x: number) => {
    if (x === -1) {
      onActiveIndexChange(-1);
      return;
    }
    const chartWidth = Dimensions.get('window').width - 32;
    const xDistance = chartWidth / priceList.length;
    if (x <= 0) {
      x = 0;
    }
    if (x >= chartWidth) {
      x = chartWidth;
    }
    let value = Number((x / xDistance).toFixed(0));
    if (value >= priceList.length - 1) {
      value = priceList.length - 1;
    }
    onActiveIndexChange(value);
  };

  const prevTouch = useRef({ x: 0, y: 0 });
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => true,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        prevTouch.current = {
          x: evt.nativeEvent.locationX,
          y: evt.nativeEvent.locationY,
        };
        updatePosition(evt.nativeEvent.locationX);
      },
      onPanResponderMove: (evt: GestureResponderEvent) => {
        const deltaX = evt.nativeEvent.locationX - prevTouch.current.x;
        const deltaY = evt.nativeEvent.locationY - prevTouch.current.y;
        const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);

        updatePosition(isHorizontalSwipe ? evt.nativeEvent.locationX : -1);

        prevTouch.current = {
          x: evt.nativeEvent.locationX,
          y: evt.nativeEvent.locationY,
        };
      },
      onPanResponderRelease: () => {
        updatePosition(-1);
      },
    }),
  );

  const Line = (props: Partial<LineProps>) => {
    const { line, chartHasData } = props as LineProps;
    return (
      <Path
        key="line"
        d={line}
        stroke={chartHasData ? chartColor : theme.colors.text.alternative}
        strokeWidth={apx(4)}
        fill="none"
        opacity={chartHasData ? 1 : 0.85}
      />
    );
  };

  const DataGradient = () => (
    <Defs key="dataGradient">
      <LinearGradient
        id="portfolioDataGradient"
        x1="0"
        y1="0%"
        x2="0%"
        y2={`${CHART_HEIGHT}px`}
      >
        <Stop offset="0%" stopColor={chartColor} stopOpacity={0.25} />
        <Stop offset="90%" stopColor={chartColor} stopOpacity={0} />
      </LinearGradient>
    </Defs>
  );

  const NoDataGradient = () => {
    const gradient = (
      <Defs key="gradient">
        <LinearGradient id="noDataGradient" x1="0" y1="1" x2="0" y2="0">
          <Stop
            offset="0"
            stopColor={theme.colors.background.default}
            stopOpacity="1"
          />
          <Stop
            offset="0.5"
            stopColor={theme.colors.background.default}
            stopOpacity="0.5"
          />
          <Stop
            offset="1"
            stopColor={theme.colors.background.default}
            stopOpacity="1"
          />
        </LinearGradient>
      </Defs>
    );

    return (
      <G key="no-data-gradient">
        {gradient}
        <Rect
          x="0"
          y="0"
          width={Dimensions.get('screen').width - 32}
          height={CHART_HEIGHT}
          fill="url(#noDataGradient)"
        />
      </G>
    );
  };

  const NoDataOverlay = () => (
    <View style={styles.noDataOverlay}>
      <Text>
        <Icon
          name={IconName.Warning}
          color={IconColor.Muted}
          size={IconSize.Xl}
        />
      </Text>
      <Title style={styles.noDataOverlayTitle}>
        {strings('asset_overview.no_chart_data.title')}
      </Title>
      <Text variant={TextVariant.BodyLGMedium} style={styles.noDataOverlayText}>
        {strings('asset_overview.no_chart_data.description')}
      </Text>
    </View>
  );

  const Tooltip = ({ x, y }: Partial<TooltipProps>) => {
    if (positionX < 0) {
      return null;
    }
    return (
      <G x={x?.(positionX)} key="tooltip">
        <G>
          <SvgLine
            y1={1}
            y2={CHART_HEIGHT}
            stroke={styles.tooltipLine.color}
            strokeWidth={1}
          />
          <Circle
            cy={y?.(priceList[positionX])}
            r={apx(20 / 2)}
            stroke={styles.tooltipLine.color}
            strokeWidth={apx(1)}
            fill={chartColor}
          />
        </G>
      </G>
    );
  };

  const handleTimePeriodPress = (period: TimePeriod) => {
    onTimePeriodChange?.(period);
  };

  const displayValue = selectedValue ?? currentValue;
  const isPositiveChange = valueChange !== undefined && valueChange >= 0;

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.chartLoading}>
          <SkeletonPlaceholder>
            <SkeletonPlaceholder.Item
              width={Dimensions.get('screen').width - 32}
              height={CHART_HEIGHT}
              borderRadius={6}
            />
          </SkeletonPlaceholder>
        </View>
      </View>
    );
  }

  const chartHasData = priceList.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.valueContainer}>
          <SensitiveText
            isHidden={privacyMode}
            length={SensitiveTextLength.Long}
            variant={TextVariant.HeadingLG}
          >
            {displayValue ? `$${displayValue}` : '--'}
          </SensitiveText>
        </View>
        {valueChange !== undefined && valueChangePercentage !== undefined && (
          <View style={styles.changeContainer}>
            <SensitiveText
              isHidden={privacyMode}
              length={SensitiveTextLength.Short}
              variant={TextVariant.BodyMD}
              style={
                isPositiveChange ? styles.positiveChange : styles.negativeChange
              }
            >
              {isPositiveChange ? '+' : ''}
              {valueChange.toFixed(2)} ({valueChangePercentage.toFixed(2)}%)
            </SensitiveText>
          </View>
        )}
      </View>

      <View style={styles.chart}>
        <View style={styles.chartArea} {...panResponder.current.panHandlers}>
          {!chartHasData && <NoDataOverlay />}
          <AreaChart
            style={styles.chartArea}
            data={chartHasData ? priceList : placeholderData}
            contentInset={{ top: apx(40), bottom: apx(40) }}
            svg={
              chartHasData ? { fill: `url(#portfolioDataGradient)` } : undefined
            }
          >
            <Line chartHasData={chartHasData} />
            {chartHasData ? <Tooltip /> : <NoDataGradient />}
            {chartHasData && <DataGradient />}
          </AreaChart>
        </View>
      </View>

      <View style={styles.timePeriodContainer}>
        {TIME_PERIODS.map((period) => (
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

export default PortfolioValueChart;
