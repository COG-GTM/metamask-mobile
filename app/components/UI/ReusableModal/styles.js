// Third party dependencies.
import { StyleSheet } from 'react-native';

// External dependencies.


/**
 * Style sheet function for ReusableModal component.
 *
 * @param params Style sheet params.
 * @param params.theme App theme from ThemeContext.
 * @returns StyleSheet object.
 */
const styleSheet = (params) => {
  const { theme } = params;
  const { colors } = theme;
  return StyleSheet.create({
    absoluteFill: {
      ...StyleSheet.absoluteFillObject
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.overlay.default
    }
  });
};

export default styleSheet;