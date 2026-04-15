/* eslint-disable react/prop-types */

// Third party dependencies.
import React from 'react';
import { TouchableOpacity } from 'react-native';

// External dependencies.
import { useStyles } from '../../../hooks';

// Internal dependencies.
import styleSheet from './Card.styles';


const Card = ({ style, children, ...props }) => {
  const { styles } = useStyles(styleSheet, { style });

  return (
    <TouchableOpacity style={styles.base} {...props}>
      {children}
    </TouchableOpacity>);

};

export default Card;