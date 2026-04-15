import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../../../../../../util/theme';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import createStyles from './styles';


const SkeletonComponent = ({ width, noStyle }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={[!noStyle && styles.valuesContainer]}>
      <SkeletonPlaceholder>
        <SkeletonPlaceholder.Item width={width} height={10} borderRadius={4} />
      </SkeletonPlaceholder>
    </View>);

};

export default SkeletonComponent;