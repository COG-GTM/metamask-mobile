// Third party dependencies.
import { StyleSheet } from 'react-native';

// External dependencies.


// Internal dependencies.


/**
 * Style sheet function for PickerBase component.
 *
 * @param params Style sheet params.
 * @param params.theme App theme from ThemeContext.
 * @param params.vars Inputs that the style sheet depends on.
 * @returns StyleSheet object.
 */
const styleSheet = (params) =>


{
  const { vars, theme } = params;
  const { colors } = theme;
  const { style, dropdownIconStyle } = vars;

  return StyleSheet.create({
    base: Object.assign(
      {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border.default,
        borderRadius: 4,
        backgroundColor: colors.background.default
      },
      style
    ),
    dropdownIcon: Object.assign(
      {
        marginLeft: 16
      },
      dropdownIconStyle
    )
  });
};

export default styleSheet;