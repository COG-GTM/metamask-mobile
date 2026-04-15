// Third party dependencies.
import { StyleSheet } from 'react-native';

// External dependencies.


// Internal dependencies.


/**
 * Style sheet function for HeaderBase component.
 *
 * @param params Style sheet params.
 * @param params.theme App theme from ThemeContext.
 * @param params.vars Inputs that the style sheet depends on.
 * @returns StyleSheet object.
 */
const styleSheet = (params) =>


{
  const { vars, theme } = params;
  const { style, startAccessorySize, endAccessorySize } = vars;
  let accessoryWidth;
  if (startAccessorySize && endAccessorySize) {
    accessoryWidth = Math.max(startAccessorySize.width, endAccessorySize.width);
  }

  return StyleSheet.create({
    base: Object.assign(
      {
        backgroundColor: theme.colors.background.default,
        flexDirection: 'row'
      },
      style
    ),
    titleWrapper: {
      flex: 1,
      alignItems: 'center',
      marginHorizontal: accessoryWidth ? 0 : 16
    },
    title: {
      textAlign: 'center'
    },
    accessoryWrapper: {
      width: accessoryWidth
    }
  });
};

export default styleSheet;