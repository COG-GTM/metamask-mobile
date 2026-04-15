// Third party dependencies.
import { StyleSheet } from 'react-native';

// External dependencies.


// Internal dependencies.
import {
  ButtonsAlignment } from

'./BottomSheetFooter.types';

/**
 * Style sheet function for BottomSheetFooter component.
 *
 * @param params Style sheet params.
 * @param params.theme App theme from ThemeContext.
 * @param params.vars Inputs that the style sheet depends on.
 * @returns StyleSheet object.
 */
const styleSheet = (params) =>


{
  const { vars, theme } = params;
  const { style, buttonsAlignment } = vars;
  const buttonStyle =
  buttonsAlignment === ButtonsAlignment.Horizontal ?
  { flex: 1 } :
  { alignSelf: 'stretch' };

  return StyleSheet.create({
    base: Object.assign(
      {
        backgroundColor: theme.colors.background.default,
        flexDirection:
        buttonsAlignment === ButtonsAlignment.Horizontal ? 'row' : 'column',
        paddingVertical: 4,
        paddingHorizontal: 8
      },
      style
    ),
    button: {
      ...buttonStyle
    },
    subsequentButton: {
      ...buttonStyle,
      marginLeft: buttonsAlignment === ButtonsAlignment.Horizontal ? 16 : 0,
      marginTop: buttonsAlignment === ButtonsAlignment.Vertical ? 16 : 0
    }
  });
};

export default styleSheet;