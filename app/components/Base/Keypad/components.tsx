import React, { ReactNode } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import IonicIcon from 'react-native-vector-icons/Ionicons';
import Device from '../../../util/device';
import Text from '../Text';
import { useTheme } from '../../../util/theme';

const createStyles = (colors: Record<string, Record<string, string>>) =>
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

interface KeypadButtonProps {
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  children?: ReactNode;
  onPress?: () => void;
  accessibilityRole?: string;
  accessible?: boolean;
}

interface KeypadDeleteButtonProps {
  style?: StyleProp<ViewStyle>;
  icon?: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
}

const KeypadContainer = ({ style, ...props }: KeypadContainerProps) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return <View style={[styles.keypad, style]} {...props} />;
};


const KeypadRow = (props: { children?: ReactNode }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return <View style={styles.keypadRow} {...props} />;
};
const KeypadButton = ({ style, textStyle, children, ...props }: KeypadButtonProps) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <TouchableOpacity style={[styles.keypadButton, style]} {...props}>
      <Text style={[styles.keypadButtonText, textStyle]}>{children}</Text>
    </TouchableOpacity>
  );
};


const KeypadDeleteButton = ({ style, icon, ...props }: KeypadDeleteButtonProps) => {
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


const Keypad = KeypadContainer;
Keypad.Row = KeypadRow;
Keypad.Button = KeypadButton;
Keypad.DeleteButton = KeypadDeleteButton;

export default Keypad;
