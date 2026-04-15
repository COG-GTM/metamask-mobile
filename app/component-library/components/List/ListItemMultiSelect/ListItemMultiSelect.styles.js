// Third party dependencies.
import { StyleSheet } from 'react-native';

// External dependencies.


// Internal dependencies.


/**
 * Style sheet function for ListItemMultiSelect component.
 *
 * @param params Style sheet params.
 * @param params.theme App theme from ThemeContext.
 * @param params.vars Inputs that the style sheet depends on.
 * @returns StyleSheet object.
 */
const styleSheet = (params) =>


{
  const { vars, theme } = params;
  const { colors } = theme;
  const { style, gap, isDisabled } = vars;
  return StyleSheet.create({
    base: Object.assign(
      {
        padding: 16,
        borderRadius: 4,
        backgroundColor: colors.background.default,
        opacity: isDisabled ? 0.5 : 1
      },
      style
    ),
    listItem: {
      padding: 0
    },
    underlay: {
      ...StyleSheet.absoluteFillObject,
      flexDirection: 'row',
      backgroundColor: colors.primary.muted
    },
    checkbox: {
      marginRight: 8 - Number(gap)
    }
  });
};

export default styleSheet;