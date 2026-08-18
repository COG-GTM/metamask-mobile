// Third party dependencies.
import { StyleSheet } from 'react-native';

/**
 * Style sheet function for the activity filter bottom sheets.
 *
 * @returns StyleSheet object.
 */
const styleSheet = () =>
  StyleSheet.create({
    wrapper: {
      alignItems: 'flex-start',
      paddingBottom: 16,
    },
    title: {
      alignSelf: 'center',
      paddingTop: 16,
      paddingBottom: 16,
    },
    optionLabel: {
      width: '100%',
    },
    customRangeWrapper: {
      width: '100%',
      paddingHorizontal: 16,
      paddingTop: 8,
    },
    customRangeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
    },
    customRangeApply: {
      marginTop: 8,
    },
  });

export default styleSheet;
