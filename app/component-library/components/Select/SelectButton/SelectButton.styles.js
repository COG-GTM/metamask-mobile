// Third party dependencies.
import { StyleSheet } from 'react-native';

// External dependencies.


// Internal dependencies.
import {

  SelectButtonSize } from
'./SelectButton.types';

/**
 * Style sheet function for SelectButton component.
 *
 * @param params Style sheet params.
 * @param params.theme App theme from ThemeContext.
 * @param params.vars Inputs that the style sheet depends on.
 * @returns StyleSheet object.
 */
const styleSheet = (params) =>


{
  const { theme, vars } = params;
  const { style, size, isDisabled, isDanger } = vars;
  let verticalPadding;
  let minHeight;

  switch (size) {
    case SelectButtonSize.Sm:
      verticalPadding = 4;
      minHeight = 32;
      break;
    case SelectButtonSize.Md:
      verticalPadding = 8;
      minHeight = 40;
      break;
    case SelectButtonSize.Lg:
      verticalPadding = 12;
      minHeight = 48;
      break;
    default:
      verticalPadding = 8;
      minHeight = 40;
      break;
  }

  return StyleSheet.create({
    base: Object.assign(
      {
        paddingHorizontal: 16,
        paddingVertical: verticalPadding,
        borderRadius: 8,
        borderColor: isDanger ?
        theme.colors.error.default :
        theme.colors.border.default,
        borderWidth: isDanger ? 2 : 1,
        backgroundColor: theme.colors.background.default,
        opacity: isDisabled ? 0.5 : 1,
        minHeight
      },
      style
    )
  });
};

export default styleSheet;