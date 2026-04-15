// Third party dependencies.
import { StyleSheet } from 'react-native';

// External dependencies.


// Internal dependencies.


/**
 * Style sheet function for Tag component.
 *
 * @param params Style sheet params.
 * @param params.theme App theme from ThemeContext.
 * @param params.vars Inputs that the style sheet depends on.
 * @returns StyleSheet object.
 */
const styleSheet = (params) => {
  const { theme, vars } = params;
  const { style } = vars;
  return StyleSheet.create({
    base: Object.assign(
      {
        backgroundColor: theme.colors.background.default,
        borderColor: theme.colors.border.default,
        borderWidth: 1,
        borderRadius: 10,
        height: 24,
        paddingHorizontal: 4,
        justifyContent: 'center'
      },
      style
    )
  });
};

export default styleSheet;