import React, { ReactNode } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
// eslint-disable-next-line import/no-unresolved
// @ts-expect-error - platform-specific module resolves via Metro
import GenericButton from '../GenericButton';
import { useTheme } from '../../../util/theme';
import { Theme } from '@metamask/design-tokens';

const createStyles = (colors: Theme['colors']) =>
  StyleSheet.create({
    button: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary.default,
      paddingVertical: 10,
      paddingHorizontal: 15,
      height: 40,
      borderRadius: 4,
    },
  });

interface ButtonProps {
  /**
   * Children components of the Button
   */
  children?: ReactNode;
  /**
   * Styles to be applied to the Button
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Function to be called on press
   */
  onPress?: () => void;
}

/**
 * @deprecated This `<Button>` component has been deprecated in favor of the new `<Button>` component from the component-library.
 * Please update your code to use the new `<Button>` component instead, which can be found at app/component-library/components/Buttons/Button/Button.tsx.
 */
const Button = (props: ButtonProps) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <GenericButton onPress={props.onPress} style={[styles.button, props.style]}>
      {props.children}
    </GenericButton>
  );
};

export default Button;
