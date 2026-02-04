import React, { useState } from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';
import { PieChart } from 'react-native-svg-charts';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';

import { strings } from '../../../../../../locales/i18n';
import { useStyles } from '../../../../../component-library/hooks';
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
import { selectPrivacyMode } from '../../../../../selectors/preferencesController';

import styleSheet, { CHART_SIZE } from './AssetAllocationChart.styles';
import {
  AssetAllocationChartProps,
  AssetAllocation,
} from './AssetAllocationChart.types';

const AssetAllocationChart = ({
  data,
  isLoading = false,
  totalValue,
}: AssetAllocationChartProps) => {
  const privacyMode = useSelector(selectPrivacyMode);
  const { styles } = useStyles(styleSheet, {});
  const [selectedSlice, setSelectedSlice] = useState<string | null>(null);

  const pieData = data.map((item: AssetAllocation) => ({
    key: item.key,
    value: item.value,
    svg: {
      fill: item.color,
      onPress: () => setSelectedSlice(item.key === selectedSlice ? null : item.key),
    },
    arc: {
      outerRadius: item.key === selectedSlice ? '105%' : '100%',
      innerRadius: '60%',
    },
  }));

  const selectedItem = data.find((item) => item.key === selectedSlice);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <SkeletonPlaceholder>
            <SkeletonPlaceholder.Item
              width={CHART_SIZE}
              height={CHART_SIZE}
              borderRadius={CHART_SIZE / 2}
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
            {strings('portfolio_analytics.no_allocation_data')}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.chartContainer}>
        <PieChart
          style={styles.chart}
          data={pieData}
          innerRadius="60%"
          outerRadius="100%"
          padAngle={0.02}
        />
        <View style={styles.centerLabel}>
          {selectedItem ? (
            <>
              <SensitiveText
                isHidden={privacyMode}
                length={SensitiveTextLength.Medium}
                variant={TextVariant.HeadingSM}
              >
                {selectedItem.percentage.toFixed(1)}%
              </SensitiveText>
              <Text variant={TextVariant.BodySM} color={TextColor.Alternative}>
                {selectedItem.symbol}
              </Text>
            </>
          ) : (
            <>
              <SensitiveText
                isHidden={privacyMode}
                length={SensitiveTextLength.Long}
                variant={TextVariant.HeadingSM}
              >
                {totalValue ? `$${totalValue}` : '--'}
              </SensitiveText>
              <Text variant={TextVariant.BodySM} color={TextColor.Alternative}>
                {strings('portfolio_analytics.total_value')}
              </Text>
            </>
          )}
        </View>
      </View>

      <View style={styles.legendContainer}>
        {data.map((item: AssetAllocation) => (
          <View key={item.key} style={styles.legendItem}>
            <View
              style={[
                styles.legendColorIndicator,
                { backgroundColor: item.color },
              ]}
            />
            <View style={styles.legendTextContainer}>
              <View style={styles.legendNameContainer}>
                <Text variant={TextVariant.BodyMD}>{item.name}</Text>
                {item.networkName && (
                  <Text variant={TextVariant.BodySM} color={TextColor.Alternative}>
                    {item.networkName}
                  </Text>
                )}
              </View>
              <View style={styles.legendPercentage}>
                <SensitiveText
                  isHidden={privacyMode}
                  length={SensitiveTextLength.Short}
                  variant={TextVariant.BodyMD}
                >
                  {item.percentage.toFixed(1)}%
                </SensitiveText>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

export default AssetAllocationChart;
