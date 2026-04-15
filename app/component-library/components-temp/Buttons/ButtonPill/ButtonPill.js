// Third party dependencies.
import React, { useCallback, useState } from 'react';
import { TouchableOpacity } from 'react-native';

// External dependencies.
import { useStyles } from '../../../hooks';

// Internal dependencies.
import stylesheet from './ButtonPill.styles';

/**
 * ButtonPill component props.
 */







const ButtonPill = ({
  onPress,
  onPressIn,
  onPressOut,
  style,
  isDisabled = false,
  children,
  ...props
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const { styles } = useStyles(stylesheet, {
    style,
    isPressed,
    isDisabled
  });

  const triggerOnPressedIn = useCallback(
    (e) => {
      setIsPressed(true);
      onPressIn?.(e);
    },
    [setIsPressed, onPressIn]
  );

  const triggerOnPressedOut = useCallback(
    (e) => {
      setIsPressed(false);
      onPressOut?.(e);
    },
    [setIsPressed, onPressOut]
  );

  return (
    <TouchableOpacity
      style={styles.base}
      onPress={!isDisabled ? onPress : undefined}
      onPressIn={!isDisabled ? triggerOnPressedIn : undefined}
      onPressOut={!isDisabled ? triggerOnPressedOut : undefined}
      accessible
      activeOpacity={1}
      disabled={isDisabled}
      {...props}>
      
      {children}
    </TouchableOpacity>);

};

export default ButtonPill;