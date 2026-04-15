// Third party dependencies.
import { StyleSheet } from 'react-native';

// External dependencies.


// Internal dependencies.
import { VerticalAlignment } from './ListItem.types';

/**
 * Style sheet function for ListItem component.
 *
 * @param params Style sheet params.
 * @param params.theme App theme from ThemeContext.
 * @param params.vars Inputs that the style sheet depends on.
 * @returns StyleSheet object.
 */
const styleSheet = (params) => {
  const { vars } = params;
  const { style, verticalAlignment, topAccessoryGap, bottomAccessoryGap } =
  vars;
  let alignItems;
  switch (verticalAlignment) {
    case VerticalAlignment.Center:
      alignItems = 'center';
      break;
    case VerticalAlignment.Bottom:
      alignItems = 'flex-end';
      break;
    case VerticalAlignment.Top:
    default:
      alignItems = 'flex-start';
  }

  return StyleSheet.create({
    base: Object.assign(
      {
        padding: 16
      },
      style
    ),
    item: {
      flexDirection: 'row',
      alignItems
    },
    topAccessory: {
      marginBottom: topAccessoryGap ?? 0
    },
    bottomAccessory: {
      marginTop: bottomAccessoryGap ?? 0
    }
  });
};

export default styleSheet;