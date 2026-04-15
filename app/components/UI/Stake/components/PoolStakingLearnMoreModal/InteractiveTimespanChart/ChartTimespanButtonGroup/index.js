import React, { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import Text, {
  TextVariant,
  TextColor } from
'../../../../../../../component-library/components/Texts/Text';
import { useStyles } from '../../../../../../hooks/useStyles';
import styleSheet from './ChartTimespanButtonGroup.styles';

import SkeletonPlaceholder from 'react-native-skeleton-placeholder';






const ChartTimespanButton = ({
  onPress,
  label,
  isSelected = false
}) => {
  const { styles } = useStyles(styleSheet, { isSelected });

  return (
    <TouchableOpacity style={styles.chartTimespanButton} onPress={onPress}>
      <Text variant={TextVariant.BodyMDMedium} color={TextColor.Alternative}>
        {label}
      </Text>
    </TouchableOpacity>);

};







const ChartTimespanButtonGroup = ({
  buttons,
  onPress,
  isLoading = false
}) => {
  const { styles } = useStyles(styleSheet, { isSelected: false });

  const [selectedIndex, setSelectedIndex] = useState(0);

  const handlePress = (index) => {
    setSelectedIndex(index);
    onPress?.(buttons?.[index]?.value);
  };

  if (isLoading) {
    return (
      <View style={styles.chartTimespanButtonGroup}>
        <SkeletonPlaceholder>
          <SkeletonPlaceholder.Item
            {...styles.chartTimespanButtonGroupSkeleton}>
            
            <SkeletonPlaceholder.Item {...styles.chartTimespanButtonSkeleton} />
            <SkeletonPlaceholder.Item {...styles.chartTimespanButtonSkeleton} />
            <SkeletonPlaceholder.Item {...styles.chartTimespanButtonSkeleton} />
            <SkeletonPlaceholder.Item {...styles.chartTimespanButtonSkeleton} />
          </SkeletonPlaceholder.Item>
        </SkeletonPlaceholder>
      </View>);

  }

  return (
    <View style={styles.chartTimespanButtonGroup}>
      {buttons?.map(({ label }, index) =>
      <ChartTimespanButton
        key={`${label}-${index}`}
        label={label}
        isSelected={index === selectedIndex}
        onPress={() => handlePress(index)} />

      )}
    </View>);

};

export default ChartTimespanButtonGroup;