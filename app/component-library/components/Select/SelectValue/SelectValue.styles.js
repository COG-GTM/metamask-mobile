// Third party dependencies.
import { StyleSheet } from 'react-native';

// External dependencies.


// Internal dependencies.


/**
 * Style sheet function for SelectValue component.
 *
 * @param params Style sheet params.
 * @param params.theme App theme from ThemeContext.
 * @param params.vars Inputs that the style sheet depends on.
 * @returns StyleSheet object.
 */
const styleSheet = (params) =>


{
  const { vars } = params;
  const { style } = vars;

  return StyleSheet.create({
    base: Object.assign(
      {
        padding: 0,
        flex: 1
      },
      style
    )
  });
};

export default styleSheet;