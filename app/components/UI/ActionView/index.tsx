import React, { ReactNode } from 'react';
import StyledButton from '../StyledButton';
import {
  Keyboard,
  StyleSheet,
  View,
  ActivityIndicator,
  TouchableWithoutFeedback,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { baseStyles } from '../../../styles/common';
import { strings } from '../../../../locales/i18n';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useTheme } from '../../../util/theme';
import { Colors } from '../../../util/theme/models';

export enum ConfirmButtonState {
  Error = 'error',
  Warning = 'warning',
  Normal = 'normal',
}

type ConfirmButtonMode = 'normal' | 'confirm' | 'sign';

const getStyles = (colors: Colors) =>
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

export interface ActionViewProps {
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
  children?: ReactNode;
  /**
   * Type of button to show as the confirm button
   */
  confirmButtonMode?: ConfirmButtonMode;
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
  confirmButtonState?: ConfirmButtonState;
  /**
   * Optional TestID for the parent scroll View
   */
  scrollViewTestID?: string;
  /**
   * Optional View styles. Applies to scroll view content container
   */
  contentContainerStyle?: StyleProp<ViewStyle>;
}

/**
 * Component that renders scrollable content above configurable buttons
 */
const ActionView: React.FC<ActionViewProps> = ({
  cancelTestID = '',
  confirmTestID = '',
  cancelText: cancelTextProp = '',
  children,
  confirmText: confirmTextProp = '',
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
  style,
  confirmButtonState = ConfirmButtonState.Normal,
  scrollViewTestID,
  contentContainerStyle,
}) => {
  const { colors } = useTheme();
  const confirmText = confirmTextProp || strings('action_view.confirm');
  const cancelText = cancelTextProp || strings('action_view.cancel');
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
          onPress={() => {
            if (keyboardShouldPersistTaps === 'handled') {
              Keyboard.dismiss();
            }
            onTouchablePress?.();
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
};

export default ActionView;
