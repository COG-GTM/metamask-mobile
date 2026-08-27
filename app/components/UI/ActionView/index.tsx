import React from 'react';
import StyledButton from '../StyledButton';
import PropTypes from 'prop-types';
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

// @ts-expect-error -- legacy JavaScript UI type boundary
const getStyles = (colors) =>
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
interface ActionViewProps {
  cancelTestID?: string;
  confirmTestID?: string;
  cancelText?: string;
  children?: React.ReactNode;
  confirmButtonMode?: any;
  confirmText?: string;
  confirmed?: boolean;
  confirmDisabled?: boolean;
  onCancelPress?: (...args: any[]) => any;
  onConfirmPress?: (...args: any[]) => any;
  onTouchablePress?: (...args: any[]) => any;
  showCancelButton?: boolean;
  showConfirmButton?: boolean;
  loading?: boolean;
  keyboardShouldPersistTaps?: string;
  style?: Record<string, any>;
  confirmButtonState?: string;
  scrollViewTestID?: string;
  contentContainerStyle?: Record<string, any>;
}

export default function ActionView({
// @ts-expect-error -- legacy JavaScript UI type boundary
  cancelTestID,
// @ts-expect-error -- legacy JavaScript UI type boundary
  confirmTestID,
// @ts-expect-error -- legacy JavaScript UI type boundary
  cancelText,
// @ts-expect-error -- legacy JavaScript UI type boundary
  children,
// @ts-expect-error -- legacy JavaScript UI type boundary
  confirmText,
// @ts-expect-error -- legacy JavaScript UI type boundary
  confirmButtonMode,
// @ts-expect-error -- legacy JavaScript UI type boundary
  onCancelPress,
// @ts-expect-error -- legacy JavaScript UI type boundary
  onConfirmPress,
// @ts-expect-error -- legacy JavaScript UI type boundary
  onTouchablePress,
// @ts-expect-error -- legacy JavaScript UI type boundary
  showCancelButton,
// @ts-expect-error -- legacy JavaScript UI type boundary
  showConfirmButton,
// @ts-expect-error -- legacy JavaScript UI type boundary
  confirmed,
// @ts-expect-error -- legacy JavaScript UI type boundary
  confirmDisabled,
  loading = false,
  keyboardShouldPersistTaps = 'never',
  style = undefined,
  confirmButtonState = ConfirmButtonState.Normal,
// @ts-expect-error -- legacy JavaScript UI type boundary
  scrollViewTestID,
// @ts-expect-error -- legacy JavaScript UI type boundary
  contentContainerStyle,
}) {
  const { colors } = useTheme();
  confirmText = confirmText || strings('action_view.confirm');
  cancelText = cancelText || strings('action_view.cancel');
  const styles = getStyles(colors);

  return (
    <View style={baseStyles.flexGrow}>
      <KeyboardAwareScrollView
        style={[baseStyles.flexGrow, style]}
        resetScrollToCoords={{ x: 0, y: 0 }}
// @ts-expect-error -- legacy JavaScript UI type boundary
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

ActionView.propTypes = {
  /**
   * TestID for the cancel button
   */
  cancelTestID: PropTypes.string,
  /**
   * TestID for the confirm button
   */
  confirmTestID: PropTypes.string,
  /**
   * Text to show in the cancel button
   */
  cancelText: PropTypes.string,
  /**
   * Content to display above the action buttons
   */
  children: PropTypes.node,
  /**
   * Type of button to show as the confirm button
   */
  confirmButtonMode: PropTypes.oneOf(['normal', 'confirm', 'sign']),
  /**
   * Text to show in the confirm button
   */
  confirmText: PropTypes.string,
  /**
   * Whether action view was confirmed in order to block any other interaction
   */
  confirmed: PropTypes.bool,
  /**
   * Whether action view confirm button should be disabled
   */
  confirmDisabled: PropTypes.bool,
  /**
   * Called when the cancel button is clicked
   */
  onCancelPress: PropTypes.func,
  /**
   * Called when the confirm button is clicked
   */
  onConfirmPress: PropTypes.func,
  /**
   * Called when the touchable without feedback is clicked
   */
  onTouchablePress: PropTypes.func,

  /**
   * Whether cancel button is shown
   */
  showCancelButton: PropTypes.bool,
  /**
   * Whether confirm button is shown
   */
  showConfirmButton: PropTypes.bool,
  /**
   * Loading after confirm
   */
  loading: PropTypes.bool,
  /**
   * Determines if the keyboard should stay visible after a tap
   */
  keyboardShouldPersistTaps: PropTypes.string,
  /**
   * Optional View styles. Applies to scroll view
   */
  style: PropTypes.object,
  /**
   * Optional Confirm button state - this can be Error/Warning/Normal.
   */
  confirmButtonState: PropTypes.string,

  /**
   * Optional TestID for the parent scroll View
   */
  scrollViewTestID: PropTypes.string,
  /**
   * Optional View styles. Applies to scroll view
   */
  contentContainerStyle: PropTypes.object,
};
