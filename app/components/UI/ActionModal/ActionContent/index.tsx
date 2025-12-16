import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import StyledButton from '../../StyledButton';
import { strings } from '../../../../../locales/i18n';
import { useTheme } from '../../../../util/theme';
import { Theme } from '../../../../util/theme/models';

interface Styles {
  viewWrapper: ViewStyle;
  viewContainer: ViewStyle;
  actionHorizontalContainer: ViewStyle;
  actionVerticalContainer: ViewStyle;
  childrenContainer: ViewStyle;
  button: ViewStyle;
  buttonHorizontal: ViewStyle;
}

const createStyles = (colors: Theme['colors']): Styles =>
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

interface ActionContentProps {
  cancelTestID?: string;
  confirmTestID?: string;
  cancelText?: string;
  children?: ReactNode;
  confirmText?: string;
  confirmDisabled?: boolean;
  cancelButtonMode?: string;
  cancelButtonDisabled?: boolean;
  confirmButtonMode?: string;
  displayCancelButton?: boolean;
  displayConfirmButton?: boolean;
  onCancelPress?: () => void;
  onConfirmPress?: () => void;
  viewWrapperStyle?: ViewStyle;
  viewContainerStyle?: ViewStyle;
  actionContainerStyle?: ViewStyle;
  childrenContainerStyle?: ViewStyle;
  verticalButtons?: boolean;
}

export default function ActionContent({
  cancelTestID = '',
  confirmTestID = '',
  cancelText = strings('action_view.cancel'),
  children,
  confirmText = strings('action_view.confirm'),
  confirmDisabled = false,
  cancelButtonMode = 'neutral',
  cancelButtonDisabled = false,
  confirmButtonMode = 'warning',
  displayCancelButton = true,
  displayConfirmButton = true,
  onCancelPress,
  onConfirmPress,
  viewWrapperStyle = undefined,
  viewContainerStyle = undefined,
  actionContainerStyle,
  childrenContainerStyle = undefined,
  verticalButtons,
}: ActionContentProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

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
              {cancelText}
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
              {confirmText}
            </StyledButton>
          )}
        </View>
      </View>
    </View>
  );
}
