import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ViewProps,
  TouchableOpacityProps,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import IonicIcon from 'react-native-vector-icons/Ionicons';
import { Theme } from '@metamask/design-tokens';
import Device from '../../../util/device';
import Text from '../Text';
import { useTheme } from '../../../util/theme';

const createStyles = (colors: Theme['colors']) =>
  StyleSheet.create({
    keypad: {
      paddingHorizontal: 25,
    },
    keypadRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    keypadButton: {
      paddingHorizontal: 20,
      paddingVertical: Device.isMediumDevice()
        ? Device.isIphone5()
          ? 4
          : 8
        : 12,
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    keypadButtonText: {
      color: colors.text.default,
      textAlign: 'center',
      fontSize: 30,
    },
    deleteIcon: {
      fontSize: 25,
      marginTop: 5,
    },
  });

interface KeypadContainerProps extends ViewProps {
  /**
   * Custom style for digit buttons
   */
  style?: StyleProp<ViewStyle>;
}

type KeypadRowProps = ViewProps;

interface KeypadButtonProps extends TouchableOpacityProps {
  children?: React.ReactNode;
  /**
   * Custom style for digit buttons
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Custom style for digit text
   */
  textStyle?: StyleProp<TextStyle>;
}

interface KeypadDeleteButtonProps extends TouchableOpacityProps {
  /**
   * Custom style for digit buttons
   */
  style?: StyleProp<ViewStyle>;
  icon?: React.ReactNode;
}

type KeypadComponent = React.FC<KeypadContainerProps> & {
  Row: React.FC<KeypadRowProps>;
  Button: React.FC<KeypadButtonProps>;
  DeleteButton: React.FC<KeypadDeleteButtonProps>;
};

const KeypadContainer: KeypadComponent = ({ style, ...props }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return <View style={[styles.keypad, style]} {...props} />;
};

const KeypadRow: React.FC<KeypadRowProps> = (props) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return <View style={styles.keypadRow} {...props} />;
};

const KeypadButton: React.FC<KeypadButtonProps> = ({
  style,
  textStyle,
  children,
  ...props
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <TouchableOpacity style={[styles.keypadButton, style]} {...props}>
      <Text style={[styles.keypadButtonText, textStyle]}>{children}</Text>
    </TouchableOpacity>
  );
};

const KeypadDeleteButton: React.FC<KeypadDeleteButtonProps> = ({
  style,
  icon,
  ...props
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <TouchableOpacity style={[styles.keypadButton, style]} {...props}>
      {icon || (
        <IonicIcon
          style={[styles.keypadButtonText, styles.deleteIcon]}
          name="arrow-back"
        />
      )}
    </TouchableOpacity>
  );
};

KeypadContainer.Row = KeypadRow;
KeypadContainer.Button = KeypadButton;
KeypadContainer.DeleteButton = KeypadDeleteButton;

const Keypad = KeypadContainer;

export default Keypad;
