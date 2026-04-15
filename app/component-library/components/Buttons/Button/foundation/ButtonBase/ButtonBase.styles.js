// Third party dependencies.
import { StyleSheet } from 'react-native';

// External dependencies.

import { ButtonSize, ButtonWidthTypes } from '../../Button.types';

// Internal dependencies.


/**
 * Style sheet function for ButtonBase component.
 *
 * @param params Style sheet params.
 * @param params.vars Inputs that the style sheet depends on.
 * @returns StyleSheet object.
 */
const styleSheet = (params) =>


{
  const { vars, theme } = params;
  const { style, size, width, isDisabled } = vars;
  const isAutoSize = size === ButtonSize.Auto;
  let widthObject;
  switch (width) {
    case ButtonWidthTypes.Auto:
      widthObject = { alignSelf: 'flex-start' };
      break;
    case ButtonWidthTypes.Full:
      widthObject = { alignSelf: 'stretch' };
      break;
    default:
      widthObject = { width };
  }

  return StyleSheet.create({
    base: Object.assign(
      {
        flexDirection: 'row',
        backgroundColor: theme.colors.background.alternative,
        height: isAutoSize ? size : Number(size),
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: isAutoSize ? 0 : 12,
        paddingHorizontal: isAutoSize ? 0 : 16,
        ...(isDisabled && { opacity: 0.5 }),
        ...widthObject
      },
      style
    ),
    startIcon: {
      marginRight: 8
    },
    endIcon: {
      marginLeft: 8
    },
    label: {
      color: theme.colors.text.default
    }
  });
};

export default styleSheet;