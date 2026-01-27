import React, { ReactNode } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import IonicIcon from 'react-native-vector-icons/Ionicons';
import Device from '../../../util/device';
import Text from '../Text';
import { useTheme } from '../../../util/theme';
import { Theme } from '@metamask/design-tokens';

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

interface KeypadContainerProps {
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

interface KeypadRowProps {
  children?: ReactNode;
}

interface KeypadButtonProps extends TouchableOpacityProps {
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  children?: ReactNode;
}

interface KeypadDeleteButtonProps extends TouchableOpacityProps {
  style?: StyleProp<ViewStyle>;
  icon?: ReactNode;
  testID?: string;
}

type KeypadComponent = React.FC<KeypadContainerProps> & {
  Row: React.FC<KeypadRowProps>;
  Button: React.FC<KeypadButtonProps>;
  DeleteButton: React.FC<KeypadDeleteButtonProps>;
};

const KeypadContainer: React.FC<KeypadContainerProps> = ({
  style,
  ...props
}) => {
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

const Keypad: KeypadComponent = KeypadContainer as KeypadComponent;
Keypad.Row = KeypadRow;
Keypad.Button = KeypadButton;
Keypad.DeleteButton = KeypadDeleteButton;

export default Keypad;
