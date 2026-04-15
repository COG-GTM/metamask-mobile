// Third library dependencies.
import { StyleSheet } from 'react-native';

// External dependencies.


// Internal dependencies.


/**
 * Style sheet function for CellSelect component.
 *
 * @param params Style sheet params.
 * @param params.theme App theme from ThemeContext.
 * @param params.vars Inputs that the style sheet depends on.
 * @returns StyleSheet object.
 */
const styleSheet = (params) =>


{
  const { vars } = params;
  const { style } = vars;
  const { colors } = params.theme;

  return StyleSheet.create({
    base: Object.assign(
      {
        padding: 16
      },
      style
    ),
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
    },
    selectedTag: {
      backgroundColor: colors.primary.muted
    },
    containerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 0,
      zIndex: 1
    },
    arrowStyle: {
      paddingLeft: 8,
      paddingTop: 24
    }
  });
};

export default styleSheet;