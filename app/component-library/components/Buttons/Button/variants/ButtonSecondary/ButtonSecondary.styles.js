// Third party dependencies.
import { StyleSheet } from 'react-native';

// External dependencies.


// Internal dependencies.


/**
 * Style sheet function for ButtonSecondary component.
 *
 * @param params Style sheet params.
 * @param params.vars Inputs that the style sheet depends on.
 * @returns StyleSheet object.
 */
const styleSheet = (params) =>


{
  const { vars, theme } = params;
  const { colors } = theme;
  const { style, isDanger, pressed } = vars;
  const colorObj = isDanger ? colors.error : colors.primary;

  return StyleSheet.create({
    base: Object.assign(
      {
        backgroundColor: pressed ? colorObj.alternative : 'transparent',
        borderWidth: 1,
        borderColor: colorObj.default
      },
      style
    )
  });
};

export default styleSheet;