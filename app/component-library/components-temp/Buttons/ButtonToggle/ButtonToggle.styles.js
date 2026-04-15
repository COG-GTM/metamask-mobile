// Third party dependencies.
import { StyleSheet } from 'react-native';

// External dependencies.


// Internal dependencies.


/**
 * Style sheet function for ButtonToggle component.
 *
 * @param params Style sheet params.
 * @param params.vars Inputs that the style sheet depends on.
 * @returns StyleSheet object.
 */
const styleSheet = (params) =>


{
  const { vars, theme } = params;
  const { colors } = theme;
  const { style, isActive, size } = vars;
  const colorObj = colors.primary;

  return StyleSheet.create({
    base: Object.assign(
      {
        backgroundColor: isActive ? colorObj.muted : 'transparent',
        borderWidth: 1,
        borderColor: isActive ? colorObj.default : colors.border.default,
        borderRadius: Number(size) / 2
      },
      style
    )
  });
};

export default styleSheet;