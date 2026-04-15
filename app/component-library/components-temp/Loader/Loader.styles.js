// Third party dependencies.
import { StyleSheet } from 'react-native';

// External dependencies.


/**
 * Style sheet function for SheetActions component.
 *
 * @param params Style sheet params.
 * @param params.theme App theme from ThemeContext.
 * @param params.vars Inputs that the style sheet depends on.
 * @returns StyleSheet object.
 */
const styleSheet = (params) => {
  const { theme } = params;
  const { colors } = theme;

  return StyleSheet.create({
    base: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background.default
    }
  });
};

export default styleSheet;