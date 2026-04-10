import React from 'react';
import StyledButton from '../StyledButton';
import {
  Keyboard,
  StyleSheet,
  View,
  ActivityIndicator,
  TouchableWithoutFeedback,
} from 'react-native';
import { baseStyles } from '../../../styles/common';
import { strings } from '../../../../locales/i18n';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useTheme } from '../../../util/theme';

export const ConfirmButtonState = {
  Error: 'error',
  Warning: 'warning',
  Normal: 'normal',
};

interface ActionViewProps {
  cancelTestID?: string;
  confirmTestID?: string;
  cancelText?: string;
  children?: React.ReactNode;
  confirmButtonMode?: 'normal' | 'confirm' | 'sign';
  confirmText?: string;
  confirmed?: boolean;
  confirmDisabled?: boolean;
  onCancelPress?: () => void;
  onConfirmPress?: () => void;
  onTouchablePress?: () => void;
  showCancelButton?: boolean;
  showConfirmButton?: boolean;
  loading?: boolean;
  keyboardShouldPersistTaps?: string;
  style?: any;
  confirmButtonState?: string;
  scrollViewTestID?: string;
  contentContainerStyle?: any;
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    actionContainer: {
      flex: 0,
      flexDirection: 'row',
      paddingVertical: 16,
      paddingHorizontal: 24,
    },
    button: {
      flex: 1,
    },
    cancel: {
      marginRight: 8,
    },
    confirm: {
      marginLeft: 8,
    },
    confirmButtonError: {
      backgroundColor: colors.error.default,
      borderColor: colors.error.default,
    },
    confirmButtonWarning: {
      backgroundColor: colors.warning.default,
      borderColor: colors.warning.default,
    },
  });

/**
 * PureComponent that renders scrollable content above configurable buttons
 */
export default function ActionView({
  cancelTestID = '',
  confirmTestID = '',
  cancelText = '',
  children,
  confirmText = '',
  confirmButtonMode = 'normal',
  onCancelPress,
  onConfirmPress,
  onTouchablePress,
  showCancelButton = true,
  showConfirmButton = true,
  confirmed = false,
  confirmDisabled,
  loading = false,
  keyboardShouldPersistTaps = 'never',
  style = undefined,
  confirmButtonState = ConfirmButtonState.Normal,
  scrollViewTestID,
  contentContainerStyle = undefined,
}: ActionViewProps) {
  const { colors } = useTheme();
  confirmText = confirmText || strings('action_view.confirm');
  cancelText = cancelText || strings('action_view.cancel');
  const styles = getStyles(colors);

  return (
    <View style={baseStyles.flexGrow}>
      <KeyboardAwareScrollView
        style={[baseStyles.flexGrow, style]}
        resetScrollToCoords={{ x: 0, y: 0 }}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        testID={scrollViewTestID}
        contentContainerStyle={contentContainerStyle}
      >
        <TouchableWithoutFeedback
          style={baseStyles.flexGrow}
          // eslint-disable-next-line react/jsx-no-bind
          onPress={() => {
            if (keyboardShouldPersistTaps === 'handled') {
              Keyboard.dismiss();
            }
            onTouchablePress && onTouchablePress();
          }}
        >
          {children}
        </TouchableWithoutFeedback>

        <View style={styles.actionContainer}>
          {showCancelButton && (
            <StyledButton
              testID={cancelTestID}
              type={confirmButtonMode === 'sign' ? 'signingCancel' : 'cancel'}
              onPress={onCancelPress}
              containerStyle={[styles.button, styles.cancel]}
              disabled={confirmed}
            >
              {cancelText}
            </StyledButton>
          )}
          {showConfirmButton && (
            <StyledButton
              testID={confirmTestID}
              type={confirmButtonMode}
              onPress={onConfirmPress}
              containerStyle={[
                styles.button,
                styles.confirm,
                confirmButtonState === ConfirmButtonState.Error
                  ? styles.confirmButtonError
                  : {},
                confirmButtonState === ConfirmButtonState.Warning
                  ? styles.confirmButtonWarning
                  : {},
              ]}
              disabled={confirmed || confirmDisabled || loading}
            >
              {confirmed || loading ? (
                <ActivityIndicator
                  size="small"
                  color={colors.primary.default}
                />
              ) : (
                confirmText
              )}
            </StyledButton>
          )}
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}
