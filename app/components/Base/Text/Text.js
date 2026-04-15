import React from 'react';
import { Text as RNText } from 'react-native';
import { useTheme } from '../../../util/theme';
import styles from './Text.styles';



























/**
 * @deprecated The `<Text />` component has been deprecated in favor of the new `<Text>` component from the component-library.
 * Please update your code to use the new `<Text>` component instead, which can be found at app/component-library/components/Texts/Text/Text.tsx.
 * You can find documentation for the new Text component in the README:
 * {@link https://github.com/MetaMask/metamask-mobile/tree/main/app/component-library/components/Texts/Text}
 * If you would like to help with the replacement of the old Text component, please submit a pull request against this GitHub issue:
 * {@link https://github.com/MetaMask/metamask-mobile/issues/6887}
 */

const Text = ({
  reset,
  centered,
  right,
  bold,
  green,
  black,
  blue,
  grey,
  red,
  orange,
  primary,
  muted,
  small,
  big,
  bigger,
  upper,
  modal,
  infoModal,
  disclaimer,
  link,
  strikethrough,
  underline,
  noMargin,
  style: externalStyle,
  ...props
}) => {
  const { colors } = useTheme();
  const style = styles(colors);

  return (
    <RNText
      style={[
      !reset && style.text,
      centered && style.centered,
      right && style.right,
      bold && style.bold,
      green && style.green,
      black && style.black,
      blue && style.blue,
      grey && style.grey,
      red && style.red,
      orange && style.orange,
      black && style.black,
      primary && style.primary,
      muted && style.muted,
      disclaimer && [style.small, style.disclaimer],
      small && style.small,
      big && style.big,
      bigger && style.bigger,
      upper && style.upper,
      modal && style.modal,
      infoModal && style.infoModal,
      link && style.link,
      strikethrough && style.strikethrough,
      underline && style.underline,
      noMargin && style.noMargin,
      externalStyle]
      }
      {...props} />);


};

export default Text;