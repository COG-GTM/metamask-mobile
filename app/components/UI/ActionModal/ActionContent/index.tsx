import React from 'react';
import { StyleSheet, View } from 'react-native';
import StyledButton from '../../StyledButton';
import { strings } from '../../../../../locales/i18n';
import { useTheme } from '../../../../util/theme';

const createStyles = (colors) =>
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

/**
 * View that renders the content of an action modal
 * The objective of this component is to reuse it in other places and not
 * only on ActionModal component
 */

interface ActionContentProps {
  cancelButtonDisabled?: boolean;
  cancelTestID?: string;
  confirmTestID?: string;
  cancelText?: string;
  children?: React.ReactNode;
  cancelButtonMode?: string;
  confirmButtonMode?: string;
  confirmDisabled?: boolean;
  confirmText?: string;
  displayCancelButton?: boolean;
  displayConfirmButton?: boolean;
  onCancelPress?: (...args: any[]) => any;
  onConfirmPress?: (...args: any[]) => any;
  viewWrapperStyle?: object;
  viewContainerStyle?: object;
  actionContainerStyle?: object;
  verticalButtons?: boolean;
  childrenContainerStyle?: object;
}

export default function ActionContent({
  cancelTestID,
  confirmTestID,
  cancelText,
  children,
  confirmText,
  confirmDisabled,
  cancelButtonMode,
  cancelButtonDisabled,
  confirmButtonMode,
  displayCancelButton,
  displayConfirmButton,
  onCancelPress,
  onConfirmPress,
  viewWrapperStyle,
  viewContainerStyle,
  actionContainerStyle,
  childrenContainerStyle,
  verticalButtons,
}) {
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

