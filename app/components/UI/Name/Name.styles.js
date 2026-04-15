import { StyleSheet } from 'react-native';

import { DisplayNameVariant } from '../../hooks/DisplayName/useDisplayName';

/**
 * Style sheet function for TagUrl component.
 *
 * @param params Style sheet params.
 * @param params.theme App theme from ThemeContext.
 * @param params.vars Inputs that the style sheet depends on.
 * @returns StyleSheet object.
 */
const styleSheet = (params) =>


{
  const { theme, vars } = params;
  const { colors } = theme;
  const { displayNameVariant } = vars;

  const backgroundColor =
  displayNameVariant === DisplayNameVariant.Saved ?
  colors.info.muted :
  colors.background.alternative;

  const textColor =
  displayNameVariant === DisplayNameVariant.Saved ?
  colors.info.default :
  colors.text.default;

  const baseStyle = {
    backgroundColor,
    borderRadius: 99,
    paddingVertical: 4,
    paddingLeft: 8,
    paddingRight: 8,
    gap: 5,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center'
  };

  const labelStyle = {
    color: textColor,
    flexShrink: 1
  };

  const imageStyle = {
    borderRadius: 8,
    height: 16,
    width: 16
  };

  return StyleSheet.create({
    base: baseStyle,
    label: labelStyle,
    image: imageStyle
  });
};

export default styleSheet;