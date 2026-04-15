// Third party dependencies.
import { StyleSheet } from 'react-native';

// External dependencies.


// Internal dependencies.

/**
 * Style sheet function for Overlay component.
 *
 * @param params Style sheet params.
 * @param params.theme App theme from ThemeContext.
 * @param params.vars Inputs that the style sheet depends on.
 * @returns StyleSheet object.
 */
const styleSheet = (params) => {
  const { theme, vars } = params;
  const { style, color } = vars;
  return StyleSheet.create({
    base: Object.assign(
      {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: color || theme.colors.overlay.default
      },
      style
    ),
    fill: {
      flex: 1
    }
  });
};

export default styleSheet;