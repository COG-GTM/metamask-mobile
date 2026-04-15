// Third party dependencies.
import { StyleSheet } from 'react-native';

// External dependencies.


// Internal dependencies.


/**
 * Style sheet function for BannerTip component.
 *
 * @param params Style sheet params.
 * @param params.theme App theme from ThemeContext.
 * @param params.vars Inputs that the style sheet depends on.
 * @returns StyleSheet object.
 */
const styleSheet = (params) =>


{
  const { theme, vars } = params;
  const { style } = vars;

  return StyleSheet.create({
    base: Object.assign(
      {
        borderWidth: 1,
        borderColor: theme.colors.border.default,
        backgroundColor: theme.colors.background.default
      },
      style
    ),
    logoContainer: {
      alignSelf: 'stretch',
      alignContent: 'center'
    },
    logo: {
      width: 60,
      height: 55
    }
  });
};

export default styleSheet;