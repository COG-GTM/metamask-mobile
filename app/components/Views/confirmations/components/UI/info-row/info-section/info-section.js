import React from 'react';
import { View } from 'react-native';

import { useStyles } from '../../../../../../../component-library/hooks';
import styleSheet from './info-section.styles';






const InfoSection = ({ children, testID }) => {
  const { styles } = useStyles(styleSheet, {});

  return (
    <View style={styles.container} testID={testID ?? 'info-section'}>
      {children}
    </View>);

};

export default InfoSection;