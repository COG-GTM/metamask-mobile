import React from 'react';
import {
  View,
  ViewStyle,
  StyleProp,
  TextStyle,
  StyleSheet,
  TouchableOpacity,
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
  children?: React.ReactNode;
}

const KeypadContainer = ({ style, ...props }: KeypadContainerProps) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return <View style={[styles.keypad, style]} {...props} />;
};

interface KeypadRowProps {
  children?: React.ReactNode;
}

const KeypadRow = (props: KeypadRowProps) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return <View style={styles.keypadRow} {...props} />;
};

interface KeypadButtonProps extends TouchableOpacityProps {
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  children?: React.ReactNode;
}

const KeypadButton = ({ style, textStyle, children, ...props }: KeypadButtonProps) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <TouchableOpacity style={[styles.keypadButton, style]} {...props}>
      <Text style={[styles.keypadButtonText, textStyle]}>{children}</Text>
    </TouchableOpacity>
  );
};

interface KeypadDeleteButtonProps extends TouchableOpacityProps {
  style?: StyleProp<ViewStyle>;
  icon?: React.ReactNode;
}

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

const Keypad = Object.assign(KeypadContainer, {
  Row: KeypadRow,
  Button: KeypadButton,
  DeleteButton: KeypadDeleteButton,
});

export default Keypad;
