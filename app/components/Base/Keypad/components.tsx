/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity
} from 'react-native';
import IonicIcon from 'react-native-vector-icons/Ionicons';
import Device from '../../../util/device';
import Text from '../Text';
import { useTheme } from '../../../util/theme';

interface KeypadComponentProps {
  children?: React.ReactNode;
  style?: any;
  textStyle?: any;
  icon?: React.ReactNode;
  [key: string]: any;
}

const createStyles = (colors: any): any =>
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

const KeypadContainer = ({ style, ...props }: KeypadComponentProps) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return <View style={[styles.keypad, style]} {...props} />;
};

const KeypadRow = (props: KeypadComponentProps) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return <View style={styles.keypadRow} {...props} />;
};
const KeypadButton = ({
  style,
  textStyle,
  children,
  ...props
}: KeypadComponentProps) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <TouchableOpacity style={[styles.keypadButton, style]} {...props}>
      <Text style={[styles.keypadButtonText, textStyle]}>{children}</Text>
    </TouchableOpacity>
  );
};

const KeypadDeleteButton = ({
  style,
  icon,
  ...props
}: KeypadComponentProps) => {
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

type KeypadComponent = typeof KeypadContainer & {
  Row: typeof KeypadRow;
  Button: typeof KeypadButton;
  DeleteButton: typeof KeypadDeleteButton;
};

const Keypad = KeypadContainer as KeypadComponent;
Keypad.Row = KeypadRow;
Keypad.Button = KeypadButton;
Keypad.DeleteButton = KeypadDeleteButton;

export default Keypad;
