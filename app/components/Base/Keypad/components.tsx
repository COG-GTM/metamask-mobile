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
import { Theme } from '../../../util/theme/models';

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

const KeypadContainer = ({ style, ...props }: KeypadContainerProps) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return <View style={[styles.keypad, style]} {...props} />;
};

interface KeypadRowProps {
  children?: ReactNode;
}

const KeypadRow = (props: KeypadRowProps) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return <View style={styles.keypadRow} {...props} />;
};

interface KeypadButtonProps {
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  children?: ReactNode;
  onPress?: () => void;
  accessibilityRole?: 'button' | 'none';
  accessible?: boolean;
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

interface KeypadDeleteButtonProps {
  style?: StyleProp<ViewStyle>;
  icon?: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  delayLongPress?: number;
  testID?: string;
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

interface KeypadType extends React.FC<KeypadContainerProps> {
  Row: typeof KeypadRow;
  Button: typeof KeypadButton;
  DeleteButton: typeof KeypadDeleteButton;
}

const Keypad: KeypadType = Object.assign(KeypadContainer, {
  Row: KeypadRow,
  Button: KeypadButton,
  DeleteButton: KeypadDeleteButton,
});

export default Keypad;
