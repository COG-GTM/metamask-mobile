// Third party dependencies.
import { StyleSheet } from 'react-native';

// External dependencies.


// Internal dependencies.
import {

  WidthType } from
'./ListItemColumn.types';

/**
 * Style sheet function for ListItemColumn component.
 *
 * @param params Style sheet params.
 * @param params.theme App theme from ThemeContext.
 * @param params.vars Inputs that the style sheet depends on.
 * @returns StyleSheet object.
 */
const styleSheet = (params) =>


{
  const { vars } = params;
  const { style, widthType } = vars;

  return StyleSheet.create({
    base: Object.assign(
      {
        flex: widthType === WidthType.Auto ? -1 : 1
      },
      style
    )
  });
};

export default styleSheet;