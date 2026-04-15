// Third library dependencies.
import { StyleSheet } from 'react-native';

// External dependencies.


// Internal dependencies.


/**
 * Style sheet function for CellBase component.
 *
 * @param params Style sheet params.
 * @param params.theme App theme from ThemeContext.
 * @param params.vars Inputs that the style sheet depends on.
 * @returns StyleSheet object.
 */
const styleSheet = (params) => {
  const { vars, theme } = params;
  const { colors } = theme;
  const { style } = vars;

  return StyleSheet.create({
    cellBase: Object.assign(
      {
        flexDirection: 'row'
      },
      style
    ),
    avatar: {
      marginRight: 16
    },
    cellBaseInfo: {
      flex: 1,
      alignItems: 'flex-start'
    },
    optionalAccessory: {
      marginLeft: 16
    },
    secondaryText: {
      color: colors.text.alternative
    },
    tertiaryText: {
      color: colors.text.alternative
    },
    tagLabel: {
      marginTop: 4
    }
  });
};

export default styleSheet;