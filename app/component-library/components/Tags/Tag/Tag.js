/* eslint-disable react/prop-types */

// Third party dependencies.
import React from 'react';
import { View } from 'react-native';

// External dependencies.
import Text, { TextVariant } from '../../Texts/Text';
import { useStyles } from '../../../hooks';

// Internal dependencies.
import styleSheet from './Tag.styles';


const Tag = ({ label, style, ...props }) => {
  const { styles } = useStyles(styleSheet, { style });

  return (
    <View style={styles.base} {...props}>
      <Text variant={TextVariant.BodyMD}>{label}</Text>
    </View>);

};

export default Tag;