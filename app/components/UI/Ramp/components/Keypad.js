import React from 'react';
import { StyleSheet } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import KeypadComponent from '../../../Base/Keypad';
import { useTheme } from '../../../../util/theme';
import { colors as importedColors } from '../../../../styles/common';


const createStyles = (colors, shadows) =>
StyleSheet.create({
  keypad: {
    paddingHorizontal: 24,
    backgroundColor: colors.background.alternative
  },
  digitButton: {
    borderRadius: 8,
    backgroundColor: colors.background.default,
    paddingVertical: 5,
    margin: 3.5,
    ...shadows.size.xs,
    elevation: 1
  },
  digitText: {
    fontSize: 20,
    color: colors.text.default,
    padding: 0
  },
  periodButton: {
    borderRadius: 8,
    backgroundColor: importedColors.transparent,
    paddingVertical: 0,
    margin: 3.5
  }
});








const Keypad = ({
  style,
  ...props










}) => {
  const { colors, shadows } = useTheme();
  const styles = createStyles(colors, shadows);
  return (
    <KeypadComponent
      {...props}
      style={[styles.keypad, style]}
      digitButtonStyle={styles.digitButton}
      digitTextStyle={styles.digitText}
      periodButtonStyle={styles.periodButton}
      periodTextStyle={styles.digitText}
      deleteButtonStyle={styles.periodButton}
      deleteIcon={
      <Feather name="delete" size={24} color={colors.icon.default} />
      } />);


};

export default Keypad;