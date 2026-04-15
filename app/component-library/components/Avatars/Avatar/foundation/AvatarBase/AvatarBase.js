/* eslint-disable react/prop-types */

// Third party dependencies.
import React from 'react';
import { View } from 'react-native';

// External dependencies.
import { useStyles } from '../../../../../hooks/useStyles';

// Internal dependencies.

import styleSheet from './AvatarBase.styles';
import { DEFAULT_AVATARBASE_SIZE } from './AvatarBase.constants';

const AvatarBase = ({
  size = DEFAULT_AVATARBASE_SIZE,
  style,
  children,
  includesBorder = false,
  ...props
}) => {
  const { styles } = useStyles(styleSheet, {
    size,
    style,
    includesBorder
  });

  return (
    <View style={styles.container} {...props}>
      {children}
    </View>);

};

export default AvatarBase;