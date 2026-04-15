// Third party dependencies.
import { StyleSheet } from 'react-native';

// External dependencies.


// Internal dependencies.


/**
 * Style sheet function for AccountAction component.
 *
 * @param params Style sheet params.
 * @param params.theme App theme from ThemeContext.
 * @param params.vars Inputs that the style sheet depends on.
 * @returns StyleSheet object.
 */
const styleSheet = (params) =>


{
  const { theme, vars } = params;
  const { style, disabled } = vars;
  const { colors } = theme;

  return StyleSheet.create({
    base: Object.assign(
      {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8
      },
      style
    ),
    descriptionLabel: {
      color: disabled ? colors.text.muted : colors.text.default
    },
    icon: {
      marginHorizontal: 16,
      color: disabled ? colors.text.muted : colors.text.default
    }
  });
};

export default styleSheet;