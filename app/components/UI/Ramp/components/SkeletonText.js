import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../../../util/theme';


const createStyles = (colors) =>
StyleSheet.create({
  wrapper: {
    padding: 14,
    borderRadius: 30,
    backgroundColor: colors.background.alternative
  },
  thin: {
    padding: 8
  },
  thick: {
    padding: 20
  },
  large: {
    width: '75%'
  },
  medium: {
    width: '50%'
  },
  small: {
    width: '30%'
  },
  smaller: {
    width: '20%'
  },
  center: {
    alignSelf: 'center'
  },
  spacingVertical: {
    marginVertical: 10
  },
  spacingHorizontal: {
    marginHorizontal: 15
  },
  spacingTop: {
    marginTop: 35
  },
  spacingBottom: {
    marginBottom: 25
  },
  spacingTopSmall: {
    marginTop: 10
  },
  title: {
    paddingRight: 100
  }
});


















const SkeletonText = ({
  style,
  thin,
  thick,
  spacingVertical,
  spacingHorizontal,
  spacingBottom,
  spacingTop,
  spacingTopSmall,
  center,
  large,
  medium,
  small,
  smaller,
  title
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <View
      style={[
      styles.wrapper,
      thin && styles.thin,
      thick && styles.thick,
      large && styles.large,
      medium && styles.medium,
      small && styles.small,
      smaller && styles.smaller,
      center && styles.center,
      spacingVertical && styles.spacingVertical,
      spacingHorizontal && styles.spacingHorizontal,
      spacingBottom && styles.spacingBottom,
      spacingTop && styles.spacingTop,
      spacingTopSmall && styles.spacingTopSmall,
      title && styles.title,
      style]
      } />);


};

export default SkeletonText;