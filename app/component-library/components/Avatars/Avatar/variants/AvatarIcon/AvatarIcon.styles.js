// Third party dependencies.
import { StyleSheet } from 'react-native';

// External dependencies.


// Internal dependencies.


/**
 * Style sheet function for AvatarIcon component.
 *
 * @param params Style sheet params.
 * @param params.theme App theme from ThemeContext.
 * @param params.vars Inputs that the style sheet depends on.
 * @returns StyleSheet object.
 */
const styleSheet = (params) =>


{
  const { theme, vars } = params;
  const { colors } = theme;
  const { style, backgroundColor } = vars;
  return StyleSheet.create({
    base: Object.assign(
      {
        backgroundColor: backgroundColor || colors.primary.muted,
        alignItems: 'center',
        justifyContent: 'center'
      },
      style
    ),
    icon: {
      color: colors.primary.default
    }
  });
};

export default styleSheet;