import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../../../util/theme';


const createStyles = (colors) =>
StyleSheet.create({
  wrapper: {
    padding: 18,
    borderRadius: 6,
    backgroundColor: colors.background.alternative
  }
});





const SkeletonBox = ({ style }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return <View style={[styles.wrapper, style]} />;
};

export default SkeletonBox;