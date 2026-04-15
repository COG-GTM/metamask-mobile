// Third party dependencies.
import { StyleSheet } from 'react-native';

// External dependencies.


// Internal dependencies.


/**
 * Style sheet function for Checkbox component.
 *
 * @param params Style sheet params.
 * @param params.theme App theme from ThemeContext.
 * @param params.vars Inputs that the style sheet depends on.
 * @returns StyleSheet object.
 */
const styleSheet = (params) => {
  const { vars, theme } = params;
  const {
    style,
    checkboxStyle,
    isChecked,
    isIndeterminate,
    isDisabled,
    isReadOnly,
    isDanger
  } = vars;

  const backgroundColor = isReadOnly ?
  theme.colors.background.alternative :
  isDanger ?
  isChecked || isIndeterminate ?
  theme.colors.error.default :
  theme.colors.background.default :
  isChecked || isIndeterminate ?
  theme.colors.primary.default :
  theme.colors.background.default;

  const borderColor = isReadOnly ?
  theme.colors.background.alternative :
  isDanger ?
  theme.colors.error.default :
  isChecked || isIndeterminate ?
  theme.colors.primary.default :
  theme.colors.icon.default;

  return StyleSheet.create({
    base: Object.assign(
      {
        height: 24,
        flexDirection: 'row',
        alignItems: 'center',
        opacity: isDisabled ? 0.5 : 1
      },
      style
    ),
    checkbox: Object.assign(
      {
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 4,
        borderWidth: 2,
        backgroundColor,
        borderColor
      },
      checkboxStyle
    ),
    icon: {
      color: isReadOnly ?
      theme.colors.icon.alternative :
      theme.colors.primary.inverse
    },
    label: {
      marginLeft: 12
    }
  });
};

export default styleSheet;