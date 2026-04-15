// Third party dependencies.
import { StyleSheet } from 'react-native';

// External dependencies.


// Internal dependencies.


/**
 * Style sheet function for Card component.
 *
 * @param params Style sheet params.
 * @param params.theme App theme from ThemeContext.
 * @param params.vars Inputs that the style sheet depends on.
 * @returns StyleSheet object.
 */
const styleSheet = (params) => {
  const { vars, theme } = params;
  const { colors } = theme;
  const { style } = vars;
  return StyleSheet.create({
    base: Object.assign(
      {
        padding: 16,
        borderRadius: 4,
        backgroundColor: colors.background.default,
        borderWidth: 1,
        borderColor: colors.border.default
      },
      style
    )
  });
};

export default styleSheet;