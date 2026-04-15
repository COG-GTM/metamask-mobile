// Third party dependencies.
import { StyleSheet } from 'react-native';

// External dependencies.


// Internal dependencies.


/**
 * Style sheet function for PickerNetwork component.
 *
 * @param params Style sheet params.
 * @param params.theme App theme from ThemeContext.
 * @param params.vars PickerNetwork stylesheet vars.
 * @returns StyleSheet object.
 */
const styleSheet = (params) =>


{
  const { vars, theme } = params;
  const { colors } = theme;
  const { style } = vars;

  return StyleSheet.create({
    base: Object.assign(
      {
        height: 32,
        borderRadius: 16,
        paddingHorizontal: 8,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background.alternative,
        alignSelf: 'center'
      },
      style
    ),
    label: {
      marginHorizontal: 8,
      flexShrink: 1
    },
    networkIconContainer: {
      marginRight: 8
    }
  });
};

export default styleSheet;