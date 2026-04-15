import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useStyles } from '../../../../../../../component-library/hooks';


const styleSheet = ({ theme }) =>
StyleSheet.create({
  base: {
    height: 1,
    backgroundColor: theme.colors.border.muted,
    // Ignore the padding from the section.
    marginHorizontal: -8
  }
});

export const InfoRowDivider = () => {
  const { styles } = useStyles(styleSheet, {});

  return <View style={styles.base} />;
};