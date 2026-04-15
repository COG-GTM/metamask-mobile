import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../../../util/theme';





const borderRadius = 5;

const ProgressBar = ({ percentComplete }) => {
  const { colors } = useTheme();
  const styles = StyleSheet.create({
    wrapper: {
      height: 5,
      width: '80%',
      borderRadius,
      backgroundColor: colors.background.pressed
    },
    progressBar: {
      height: '100%',
      borderRadius,
      backgroundColor: colors.primary.default,
      width: `${percentComplete}%`
    }
  });

  return (
    <View style={styles.wrapper}>
      <View style={styles.progressBar} />
    </View>);

};

export default ProgressBar;