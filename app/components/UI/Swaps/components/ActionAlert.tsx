import React from 'react';
import { View, StyleSheet, TouchableOpacity, StyleProp, ViewStyle, TextStyle } from 'react-native';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import Alert, { AlertType } from '../../../Base/Alert';
import Text from '../../../Base/Text';
import { useTheme } from '../../../../util/theme';
import { Theme } from '@metamask/design-tokens';


const VERTICAL_DISPLACEMENT = 12;
const createStyles = (colors: Theme['colors']) =>
  StyleSheet.create({
    content: {
      flex: 1,
      alignItems: 'center',
    },
    contentWithAction: {
      marginBottom: 10,
    },
    wrapper: {
      flexDirection: 'column',
      flex: 1,
    },
    action: {
      marginTop: -5,
      marginBottom: -VERTICAL_DISPLACEMENT,
      bottom: -VERTICAL_DISPLACEMENT,
      alignItems: 'center',
    },
    button: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 100,
    },
    warningButton: {
      backgroundColor: colors.warning.default,
    },
    errorButton: {
      backgroundColor: colors.error.default,
    },
    errorButtonText: {
      color: colors.error.inverse,
    },
    infoWrapper: {
      position: 'absolute',
      top: 3,
      right: 3,
    },
    warningInfoIcon: {
      color: colors.warning.default,
    },
    errorInfoIcon: {
      color: colors.error.default,
    },
  });

const getButtonStyle = (type: AlertType | undefined, styles: ReturnType<typeof createStyles>) => {
  switch (type) {
    case AlertType.Error: {
      return styles.errorButton;
    }
    case AlertType.Warning:
    default: {
      return styles.warningButton;
    }
  }
};

const getInfoIconStyle = (type: AlertType | undefined, styles: ReturnType<typeof createStyles>) => {
  switch (type) {
    case AlertType.Error: {
      return styles.errorInfoIcon;
    }
    case AlertType.Warning:
    default: {
      return styles.warningInfoIcon;
    }
  }
};

interface ButtonProps {
  type?: AlertType;
  onPress?: () => void;
  children?: string;
}

function Button({ type, onPress, children }: ButtonProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.button, getButtonStyle(type, styles)]}
    >
      <Text
        small
        bold
        primary
        style={[type === AlertType.Error && styles.errorButtonText]}
      >
        {children}
      </Text>
    </TouchableOpacity>
  );
}

interface ActionAlertProps {
  type?: AlertType;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  onInfoPress?: () => void;
  action?: string;
  children: (textStyle: StyleProp<TextStyle>) => React.ReactNode;
}

function ActionAlert({ type, style, action, onInfoPress, onPress, children }: ActionAlertProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <Alert
      small
      type={type ?? AlertType.Info}
      style={[style, Boolean(action) && styles.contentWithAction]}
    >
      {(textStyle) => (
        <>
          <View style={styles.wrapper}>
            <View style={[styles.content]}>{children(textStyle)}</View>
            {Boolean(action) && (
              <View style={[styles.action]}>
                <Button onPress={onPress} type={type}>
                  {action}
                </Button>
              </View>
            )}
          </View>
          {Boolean(onInfoPress) && (
            <TouchableOpacity
              style={styles.infoWrapper}
              hitSlop={{ top: 15, right: 15, bottom: 15, left: 15 }}
              onPress={onInfoPress}
            >
              <MaterialIcon
                name="info"
                size={16}
                style={getInfoIconStyle(type, styles)}
              />
            </TouchableOpacity>
          )}
        </>
      )}
    </Alert>
  );
}

export default ActionAlert;
