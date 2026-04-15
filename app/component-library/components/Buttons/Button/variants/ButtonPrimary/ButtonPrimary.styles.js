// Third party dependencies.
import { StyleSheet } from 'react-native';
import { lightTheme } from '@metamask/design-tokens';

// External dependencies.


// Internal dependencies.


/**
 * Style sheet function for ButtonPrimary component.
 *
 * @param params Style sheet params.
 * @param params.vars Inputs that the style sheet depends on.
 * @returns StyleSheet object.
 */
const styleSheet = (params) =>


{
  const { vars } = params;
  const { colors } = lightTheme;
  const { style, isDanger, pressed } = vars;
  const colorObj = isDanger ? colors.error : colors.primary;

  return StyleSheet.create({
    base: Object.assign(
      {
        backgroundColor: pressed ? colorObj.alternative : colorObj.default
      },
      style
    )
  });
};

export default styleSheet;