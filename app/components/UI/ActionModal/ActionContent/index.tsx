import React from 'react';
import { StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import StyledButton from '../../StyledButton';
import { strings } from '../../../../../locales/i18n';
import { useTheme } from '../../../../util/theme';
import { Colors } from '../../../../util/theme/models';

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    viewWrapper: {
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: 24,
    },
    viewContainer: {
      width: '100%',
      backgroundColor: colors.background.default,
      borderRadius: 10,
    },
    actionHorizontalContainer: {
      flexDirection: 'row',
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border.muted,
    },
    actionVerticalContainer: {
      flexDirection: 'column',
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    childrenContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    button: {
      margin: 8,
    },
    buttonHorizontal: {
      flex: 1,
    },
  });

export interface ActionContentProps {
  cancelButtonDisabled?: boolean;
  /** TestID for the cancel button */
  cancelTestID?: string;
  /** TestID for the confirm button */
  confirmTestID?: string;
  /** Text to show in the cancel button */
  cancelText?: string;
  /** Content to display above the action buttons */
  children?: React.ReactNode;
  /** Type of button to show as the cancel button */
  cancelButtonMode?: string;
  /** Type of button to show as the confirm button */
  confirmButtonMode?: string;
  /** Whether confirm button is disabled */
  confirmDisabled?: boolean;
  /** Text to show in the confirm button */
  confirmText?: string;
  /** Whether cancel button should be displayed */
  displayCancelButton?: boolean;
  /** Whether confirm button should be displayed */
  displayConfirmButton?: boolean;
  /** Called when the cancel button is clicked */
  onCancelPress?: () => void;
  /** Called when the confirm button is clicked */
  onConfirmPress?: () => void;
  /** View wrapper style */
  viewWrapperStyle?: StyleProp<ViewStyle>;
  /** View container style */
  viewContainerStyle?: StyleProp<ViewStyle>;
  /** Action container style */
  actionContainerStyle?: StyleProp<ViewStyle>;
  /** Whether buttons are rendered vertically */
  verticalButtons?: boolean;
  /** Children container style */
  childrenContainerStyle?: StyleProp<ViewStyle>;
}

/**
 * View that renders the content of an action modal
 * The objective of this component is to reuse it in other places and not
 * only on ActionModal component
 */
export default function ActionContent({
  cancelTestID = '',
  confirmTestID = '',
  cancelText,
  children,
  confirmText,
  confirmDisabled = false,
  cancelButtonMode = 'neutral',
  cancelButtonDisabled = false,
  confirmButtonMode = 'warning',
  displayCancelButton = true,
  displayConfirmButton = true,
  onCancelPress,
  onConfirmPress,
  viewWrapperStyle = null,
  viewContainerStyle = null,
  actionContainerStyle,
  childrenContainerStyle = null,
  verticalButtons,
}: ActionContentProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const cancelButtonText = cancelText ?? strings('action_view.cancel');
  const confirmButtonText = confirmText ?? strings('action_view.confirm');

  return (
    <View style={[styles.viewWrapper, viewWrapperStyle]}>
      <View style={[styles.viewContainer, viewContainerStyle]}>
        <View style={[styles.childrenContainer, childrenContainerStyle]}>
          {children}
        </View>
        <View
          style={[
            verticalButtons
              ? styles.actionVerticalContainer
              : styles.actionHorizontalContainer,
            actionContainerStyle,
          ]}
        >
          {displayCancelButton && (
            <StyledButton
              disabled={cancelButtonDisabled}
              testID={cancelTestID}
              type={cancelButtonMode}
              onPress={onCancelPress}
              containerStyle={[
                styles.button,
                !verticalButtons && styles.buttonHorizontal,
              ]}
            >
              {cancelButtonText}
            </StyledButton>
          )}
          {displayConfirmButton && (
            <StyledButton
              testID={confirmTestID}
              type={confirmButtonMode}
              onPress={onConfirmPress}
              containerStyle={[
                styles.button,
                !verticalButtons && styles.buttonHorizontal,
              ]}
              disabled={confirmDisabled}
            >
              {confirmButtonText}
            </StyledButton>
          )}
        </View>
      </View>
    </View>
  );
}
