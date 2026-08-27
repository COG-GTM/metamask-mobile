import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
// @ts-expect-error -- legacy JavaScript UI type boundary
import Button from '@metamask/react-native-button';
import getStyles from './styledButtonStyles';
import { ThemeContext, mockTheme } from '../../../util/theme';
import {
  ViewPropTypes,
  TextPropTypes,
// @ts-expect-error -- legacy JavaScript UI type boundary
} from 'deprecated-react-native-prop-types';

/**
 * @deprecated The `<StyledButton>` component has been deprecated in favor of the new `<Button>` component from the component-library.
 * Please update your code to use the new `<Button>` component instead, which can be found at app/component-library/components/Buttons/Button/Button.tsx.
 * You can find documentation for the new Button component in the README:
 * {@link https://github.com/MetaMask/metamask-mobile/tree/main/app/component-library/components/Buttons/Button/README.md}
 * If you would like to help with the replacement of the old `Button` component, please submit a pull request against this GitHub issue:
 * {@link https://github.com/MetaMask/metamask-mobile/issues/8106}
 */
interface StyledButtonProps {
  children?: any;
  disabled?: boolean;
  onPress?: (...args: any[]) => any;
  onPressOut?: (...args: any[]) => any;
  type?: string;
  testID?: string;
}

export default class StyledButton extends PureComponent<StyledButtonProps> {
  static propTypes = {
    /**
     * Children components of the Button
     * it can be a text node, an image, or an icon
     * or an Array with a combination of them
     */
    children: PropTypes.any,
    /**
     * Type of the button
     */
    disabled: PropTypes.bool,
    /**
     * Styles to be applied to the Button Text
     */
    style: TextPropTypes.style,
    /**
     * Styles to be applied to the Button disabled state text
     */
    styleDisabled: TextPropTypes.style,
    /**
     * Styles to be applied to the Button disabled container
     */
    disabledContainerStyle: ViewPropTypes.style,
    /**
     * Styles to be applied to the Button Container
     */
    containerStyle: ViewPropTypes.style,
    /**
     * Function to be called on press
     */
    onPress: PropTypes.func,
    /**
     * Function to be called on press out
     */
    onPressOut: PropTypes.func,
    /**
     * Type of the button
     */
    type: PropTypes.string,
    /**
     * ID of the element to be used on e2e tests
     */
    testID: PropTypes.string,
  };

  static defaultProps = {
// @ts-expect-error -- legacy JavaScript UI type boundary
    ...PureComponent.defaultProps,
    styleDisabled: { opacity: 0.6 },
    disabledContainerStyle: { opacity: 0.6 },
  };

  render = () => {
    const {
      type,
      onPress,
      onPressOut,
// @ts-expect-error -- legacy JavaScript UI type boundary
      style,
      children,
      disabled,
// @ts-expect-error -- legacy JavaScript UI type boundary
      styleDisabled,
      testID,
// @ts-expect-error -- legacy JavaScript UI type boundary
      disabledContainerStyle,
    } = this.props;
// @ts-expect-error -- legacy JavaScript UI type boundary
    const colors = this.context.colors || mockTheme.colors;
// @ts-expect-error -- legacy JavaScript UI type boundary
    const { fontStyle, containerStyle } = getStyles(type, colors);

    return (
      <Button
        testID={testID}
        accessibilityRole="button"
        disabled={disabled}
        styleDisabled={disabled ? styleDisabled : null}
        disabledContainerStyle={disabled ? disabledContainerStyle : null}
        onPress={onPress}
        onPressOut={onPressOut}
        style={[...fontStyle, style]}
// @ts-expect-error -- legacy JavaScript UI type boundary
        containerStyle={[...containerStyle, this.props.containerStyle]}
      >
        {children}
      </Button>
    );
  };
}

StyledButton.contextType = ThemeContext;
