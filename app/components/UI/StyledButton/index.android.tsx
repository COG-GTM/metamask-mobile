import React from 'react';
import {
  GestureResponderEvent,
  Text,
  TouchableNativeFeedback,
  View,
} from 'react-native';
import coalesceNonElementChildren from '@metamask/react-native-button/coalesceNonElementChildren';
import getStyles from './styledButtonStyles';
import { useTheme } from '../../../util/theme';
import { StyledButtonProps } from './StyledButton.types';

/**
 * @deprecated The `<StyledButton>` component has been deprecated in favor of the new `<Button>` component from the component-library.
 * Please update your code to use the new `<Button>` component instead, which can be found at app/component-library/components/Buttons/Button/Button.tsx.
 * You can find documentation for the new Button component in the README:
 * {@link https://github.com/MetaMask/metamask-mobile/tree/main/app/component-library/components/Buttons/Button/README.md}
 * If you would like to help with the replacement of the old `Button` component, please submit a pull request against this GitHub issue:
 * {@link https://github.com/MetaMask/metamask-mobile/issues/8106}
 */
const StyledButton = ({
  children,
  disabled,
  style,
  styleDisabled = { opacity: 0.6 },
  disabledContainerStyle = { opacity: 0.6 },
  containerStyle,
  onPress,
  onPressOut,
  type,
  testID,
  childGroupStyle,
  allowFontScaling,
}: StyledButtonProps) => {
  const { colors } = useTheme();
  const { fontStyle, containerStyle: typeContainerStyle } = getStyles(
    type,
    colors,
  );

  const renderGroupedChildren = () => {
    const textStyle = [...fontStyle, style, disabled ? styleDisabled : null];
    const groupStyle = [childGroupStyle];

    const groupedChildren = coalesceNonElementChildren(
      children,
      (coalescedChildren: React.ReactNode, index: number) => (
        <Text key={index} style={textStyle} allowFontScaling={allowFontScaling}>
          {coalescedChildren}
        </Text>
      ),
    );

    switch (groupedChildren.length) {
      case 0:
        return null;
      case 1:
        return groupedChildren[0];
      default:
        return <View style={groupStyle}>{groupedChildren}</View>;
    }
  };

  const touchableProps: {
    onPress?: (event: GestureResponderEvent) => void;
    onPressOut?: (event: GestureResponderEvent) => void;
  } = {};
  const containerStyles = [
    ...typeContainerStyle,
    disabled ? disabledContainerStyle : null,
    containerStyle,
  ];

  if (!disabled) {
    touchableProps.onPress = onPress;
    touchableProps.onPressOut = onPressOut;
  }

  return (
    <TouchableNativeFeedback
      {...touchableProps}
      disabled={disabled}
      accessible
      accessibilityLabel={testID}
      accessibilityRole="button"
    >
      <View style={containerStyles}>{renderGroupedChildren()}</View>
    </TouchableNativeFeedback>
  );
};

export default StyledButton;
