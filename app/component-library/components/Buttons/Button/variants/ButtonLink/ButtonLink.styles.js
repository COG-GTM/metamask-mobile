// Third party dependencies.
import { StyleSheet } from 'react-native';

// External dependencies.
import { colors } from '../../../../../../styles/common';

// Internal dependencies.


/**
 * Style sheet function for ButtonLink component.
 *
 * @param params Style sheet params.
 * @param params.theme App theme from ThemeContext.
 * @param params.vars Inputs that the style sheet depends on.
 * @returns StyleSheet object.
 */
const styleSheet = (params) => {
  const { vars } = params;
  const { style } = vars;

  return StyleSheet.create({
    base: Object.assign(
      { backgroundColor: colors.transparent },
      style
    ),
    pressedText: { textDecorationLine: 'underline' }
  });
};

export default styleSheet;