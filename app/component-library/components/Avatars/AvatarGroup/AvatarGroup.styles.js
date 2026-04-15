// Third party dependencies.
import { StyleSheet } from 'react-native';

// External dependencies.


// Internal dependencies.

import { OVERFLOWTEXTMARGIN_BY_AVATARSIZE } from './AvatarGroup.constants';

/**
 * Style sheet function for AvatarGroup component.
 *
 * @param params Style sheet params.
 * @param params.theme App theme from ThemeContext.
 * @param params.vars Inputs that the style sheet depends on.
 * @returns StyleSheet object.
 */
const styleSheet = (params) =>


{
  const { vars } = params;
  const { style, size } = vars;

  return StyleSheet.create({
    base: Object.assign(
      {
        flexDirection: 'row',
        alignItems: 'center'
      },
      style
    ),
    textStyle: {
      marginLeft: OVERFLOWTEXTMARGIN_BY_AVATARSIZE[size]
    }
  });
};

export default styleSheet;