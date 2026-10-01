import React from 'react';
import StyledButton from '../StyledButton';
import {
  Keyboard,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
  ActivityIndicator,
  TouchableWithoutFeedback,
} from 'react-native';
import { Theme } from '@metamask/design-tokens';
import { baseStyles } from '../../../styles/common';
import { strings } from '../../../../locales/i18n';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useTheme } from '../../../util/theme';

export const ConfirmButtonState = {
  Error: 'error',
  Warning: 'warning',
  Normal: 'normal',
};

const getStyles = (colors: Theme['colors']) =>
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

interface ActionViewProps {
  /**
   * TestID for the cancel button
   */
  cancelTestID?: string;
  /**
   * TestID for the confirm button
   */
  confirmTestID?: string;
  /**
   * Text to show in the cancel button
   */
  cancelText?: string;
  /**
   * Content to display above the action buttons
   */
  children?: React.ReactNode;
  /**
   * Type of button to show as the confirm button
   */
  confirmButtonMode?: 'normal' | 'confirm' | 'sign';
  /**
   * Text to show in the confirm button
   */
  confirmText?: string;
  /**
   * Whether action view was confirmed in order to block any other interaction
   */
  confirmed?: boolean;
  /**
   * Whether action view confirm button should be disabled
   */
  confirmDisabled?: boolean;
  /**
   * Called when the cancel button is clicked
   */
  onCancelPress?: () => void;
  /**
   * Called when the confirm button is clicked
   */
  onConfirmPress?: () => void;
  /**
   * Called when the touchable without feedback is clicked
   */
  onTouchablePress?: () => void;
  /**
   * Whether cancel button is shown
   */
  showCancelButton?: boolean;
  /**
   * Whether confirm button is shown
   */
  showConfirmButton?: boolean;
  /**
   * Loading after confirm
   */
  loading?: boolean;
  /**
   * Determines if the keyboard should stay visible after a tap
   */
  keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';
  /**
   * Optional View styles. Applies to scroll view
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Optional Confirm button state - this can be Error/Warning/Normal.
   */
  confirmButtonState?: string;
  /**
   * Optional TestID for the parent scroll View
   */
  scrollViewTestID?: string;
  /**
   * Optional View styles. Applies to scroll view
   */
  contentContainerStyle?: StyleProp<ViewStyle>;
}

/**
 * PureComponent that renders scrollable content above configurable buttons
 */
export default function ActionView({
  cancelTestID,
  confirmTestID,
  cancelText,
  children,
  confirmText,
  confirmButtonMode,
  onCancelPress,
  onConfirmPress,
  onTouchablePress,
  showCancelButton,
  showConfirmButton,
  confirmed,
  confirmDisabled,
  loading = false,
  keyboardShouldPersistTaps = 'never',
  style = undefined,
  confirmButtonState = ConfirmButtonState.Normal,
  scrollViewTestID,
  contentContainerStyle,
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
                <ActivityIndicator size="small" color={colors.primary.default} />
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

ActionView.defaultProps = {
  cancelText: '',
  confirmButtonMode: 'normal',
  confirmText: '',
  confirmTestID: '',
  confirmed: false,
  cancelTestID: '',
  showCancelButton: true,
  showConfirmButton: true,
  contentContainerStyle: undefined,
};
