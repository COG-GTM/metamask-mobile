// Third party dependencies.
import { StyleSheet } from 'react-native';

// External dependencies.

import { BORDERWIDTH_BY_AVATARSIZE } from '../../Avatar.constants';

// Internal dependencies.


/**
 * Style sheet function for AvatarBase component.
 *
 * @param params Style sheet params.
 * @param params.vars Inputs that the style sheet depends on.
 * @returns StyleSheet object.
 */
const styleSheet = (params) =>


{
  const {
    theme,
    vars: { style, size, includesBorder }
  } = params;
  const sizeAsNum = Number(size);

  return StyleSheet.create({
    container: Object.assign(
      {
        height: sizeAsNum,
        width: sizeAsNum,
        borderRadius: sizeAsNum / 2,
        overflow: 'hidden',
        backgroundColor: theme.colors.background.default,
        ...(includesBorder && {
          borderWidth: BORDERWIDTH_BY_AVATARSIZE[size],
          borderColor: theme.colors.background.default
        })
      },
      style
    )
  });
};

export default styleSheet;