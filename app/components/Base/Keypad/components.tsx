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
import Device from '../../../util/device';
import Text from '../Text';
import { useTheme } from '../../../util/theme';
import { Colors } from '../../../util/theme/models';

const createStyles = (colors: Colors) =>
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

const KeypadContainer = ({ style, ...props }: KeypadContainerProps) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return <View style={[styles.keypad, style]} {...props} />;
};

const KeypadRow = (props: ViewProps) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return <View style={styles.keypadRow} {...props} />;
};

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

const KeypadButton = ({
  style,
  textStyle,
  children,
  ...props
}: KeypadButtonProps) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <TouchableOpacity style={[styles.keypadButton, style]} {...props}>
      <Text style={[styles.keypadButtonText, textStyle]}>{children}</Text>
    </TouchableOpacity>
  );
};

interface KeypadDeleteButtonProps extends TouchableOpacityProps {
  /**
   * Custom style for digit buttons
   */
  style?: StyleProp<ViewStyle>;
  icon?: React.ReactNode;
}

const KeypadDeleteButton = ({
  style,
  icon,
  ...props
}: KeypadDeleteButtonProps) => {
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

interface KeypadComponent {
  (props: KeypadContainerProps): React.ReactElement;
  Row: typeof KeypadRow;
  Button: typeof KeypadButton;
  DeleteButton: typeof KeypadDeleteButton;
}

const Keypad = KeypadContainer as KeypadComponent;
Keypad.Row = KeypadRow;
Keypad.Button = KeypadButton;
Keypad.DeleteButton = KeypadDeleteButton;

export default Keypad;
