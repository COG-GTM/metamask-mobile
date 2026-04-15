// Third party dependencies.
import { StyleSheet } from 'react-native';

// External dependencies.


/**
 * Style sheet function for SelectValueBase component.
 *
 * @param params Style sheet params.
 * @param params.theme App theme from ThemeContext.
 * @param params.vars Inputs that the style sheet depends on.
 * @returns StyleSheet object.
 */
// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const styleSheet = (params) => {
  const { vars } = params;
  const { style } = vars;
  return StyleSheet.create({
    base: Object.assign({}, style)
  });
};

export default styleSheet;