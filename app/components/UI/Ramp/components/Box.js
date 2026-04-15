import React from 'react';
import {

  StyleSheet,
  TouchableOpacity,
  View } from

'react-native';
import { useTheme } from '../../../../util/theme';

import Label from '../../../../component-library/components/Form/Label';

const createStyles = (colors) =>
StyleSheet.create({
  wrapper: {
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    borderRadius: 8
  },
  label: {
    marginVertical: 8
  },
  highlighted: {
    borderColor: colors.primary.default
  },
  thin: {
    paddingVertical: 12
  },
  compact: {
    padding: 0
  }
});
















const Box = ({
  highlighted,
  label,
  style,
  thin,
  onPress,
  activeOpacity,
  accessible,
  accessibilityLabel,
  compact,
  children,
  ...props
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <>
      {Boolean(label) && <Label style={styles.label}>{label}</Label>}
      <TouchableOpacity
        disabled={!onPress}
        onPress={onPress}
        activeOpacity={activeOpacity}
        accessible={accessible ?? Boolean(onPress)}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole={onPress ? 'button' : undefined}>
        
        <View
          style={[
          styles.wrapper,
          thin && styles.thin,
          highlighted && styles.highlighted,
          compact && styles.compact,
          style]
          }
          {...props}>
          
          {children}
        </View>
      </TouchableOpacity>
    </>);

};

export default Box;