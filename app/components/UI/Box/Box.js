import React from 'react';
import { View, StyleSheet } from 'react-native';









const getBoxStyles = (props) =>








{
  const {
    display,
    flexDirection,
    justifyContent,
    alignItems,
    textAlign,
    color,
    gap,
    backgroundColor
  } = props;
  return StyleSheet.create({
    dynamicStyles: {
      ...(display && { display: display }),
      ...(flexDirection && { flexDirection }),
      ...(justifyContent && { justifyContent }),
      ...(alignItems && { alignItems }),
      ...(textAlign && { textAlign }),
      ...(color && { color }),
      ...(gap && { gap }),
      ...(backgroundColor && { backgroundColor })
    }
  });
};















export const Box = React.forwardRef(
  ({ children, ...props }, ref) =>
  <View
    {...props}
    ref={ref}
    style={[getBoxStyles(props).dynamicStyles, props.style]}
    testID={props.testID}>
    
      {children}
    </View>

);