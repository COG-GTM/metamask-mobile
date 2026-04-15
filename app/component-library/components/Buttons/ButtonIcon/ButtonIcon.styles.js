// Third party dependencies.
import { StyleSheet } from 'react-native';

// External dependencies.


// Internal dependencies.


/**
 * Style sheet function for ButtonIcon component.
 *
 * @param params Style sheet params.
 * @param params.vars Inputs that the style sheet depends on.
 * @returns StyleSheet object.
 */
const styleSheet = (params) =>


{
  const { vars, theme } = params;
  const { style, size, pressed, isDisabled } = vars;
  return StyleSheet.create({
    base: Object.assign(
      {
        alignItems: 'center',
        justifyContent: 'center',
        height: Number(size),
        width: Number(size),
        borderRadius: 8,
        ...(pressed && {
          backgroundColor: theme.colors.background.pressed
        }),
        opacity: isDisabled ? 0.5 : 1
      },
      style
    )
  });
};

export default styleSheet;