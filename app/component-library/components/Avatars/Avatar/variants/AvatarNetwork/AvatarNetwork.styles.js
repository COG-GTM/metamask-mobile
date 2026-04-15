// Third party dependencies.
import { StyleSheet } from 'react-native';

// External dependencies.
import { AvatarSize } from '../../Avatar.types';


// Internal dependencies.


/**
 * Style sheet function for AvatarNetwork component.
 *
 * @param params Style sheet params.
 * @param params.theme App theme from ThemeContext.
 * @param params.vars AvatarNetwork stylesheet vars.
 * @returns StyleSheet object.
 */
const styleSheet = (params) =>


{
  const { vars, theme } = params;
  const { size, style, showFallback } = vars;
  const baseStyle = showFallback ?
  {
    backgroundColor: theme.colors.background.alternative,
    borderWidth: 1
  } :
  {
    borderRadius: 8
  };
  return StyleSheet.create({
    base: Object.assign(
      { justifyContent: 'center', alignItems: 'center' },
      baseStyle,
      style
    ),
    label:
    // Temporarily lower font size in XS size to prevent cut off
    size === AvatarSize.Xs ? { lineHeight: undefined, fontSize: 10 } : {},
    image: {
      height: Number(size),
      width: Number(size)
    }
  });
};

export default styleSheet;